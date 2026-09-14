import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { buildSnapshot } from "../src/lib/collection";
import { formatNumber, parseCsv } from "../src/lib/receipts";
import { collectionName, normalizeBasePath, repositoryUrl } from "../src/lib/site";

const expected = buildSnapshot(readFileSync("data/receipts.csv", "utf8"), collectionName);

test("export contains the collection before JavaScript and exposes no application API", async ({ request }) => {
  const response = await request.get("./");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Collection board");
  expect(html).toContain(expected.collection.name);
  expect(html).toContain("read-only collection");
  expect(html).toContain("Receipts are added via PR by the collection owner.");
  expect(html).not.toContain("Prepare a receipt PR");
  expect(html).not.toContain("Save your private sign-in link");
  expect((await request.get("dining-icon.svg")).status()).toBe(200);
  for (const path of ["api/session", "api/data", "api/export", "data/cafe.sqlite", ".env.local"]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  expect((await request.post("api/receipts", { data: { input: "007" } })).status()).toBe(405);
});

test("board, filters, dates, details and insights work without API calls", async ({ page }) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (new URL(request.url()).pathname.includes("/api/")) apiRequests.push(request.url()); });
  await page.goto("./");
  await expect(page).toHaveTitle("Cafe 1000 - Every little number counts");
  await expect(page.getByRole("heading", { name: /Collection board/ })).toBeVisible();
  await expect(page.locator(".summary-card").filter({ hasText: "Total receipts" }).locator(".stat-value")).toHaveText(expected.stats.total.toLocaleString());
  await expect(page.locator(".number-tile")).toHaveCount(1000);
  const basePath = normalizeBasePath(process.env.CAFE_BASE_PATH);
  await expect(page.locator(`link[rel="icon"][href="${basePath}/dining-icon.svg"]`)).toHaveAttribute("type", "image/svg+xml");

  await page.getByRole("button", { name: /^Collected \d/ }).click();
  await expect(page.locator(".number-tile")).toHaveCount(expected.stats.unique);
  await page.getByRole("button", { name: /^Duplicates \d/ }).click();
  await expect(page.locator(".number-tile")).toHaveCount(expected.stats.duplicateNumbers);
  await page.getByRole("button", { name: /^Missing \d/ }).click();
  await expect(page.locator(".number-tile")).toHaveCount(expected.stats.missing);
  await page.getByRole("button", { name: "Missing list", exact: true }).click();
  if (expected.stats.missing) {
    await expect(page.getByLabel("Missing receipt numbers")).toHaveValue(expected.counts.flatMap((count, number) => count ? [] : [formatNumber(number)]).join(", "));
  } else await expect(page.getByText("Nothing missing. The album is complete!")).toBeVisible();

  const number = expected.receipts[0]?.number ?? 7;
  const formatted = formatNumber(number);
  await page.getByRole("searchbox", { name: "Find a receipt number" }).fill(String(number));
  const tile = page.locator(".number-tile");
  await expect(tile).toHaveCount(1);
  await tile.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: `The story of ${formatted}` })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: `${expected.counts[number]} ${expected.counts[number] === 1 ? "receipt" : "receipts"}`, exact: true })).toBeVisible();
  for (const receipt of expected.receipts.filter((item) => item.number === number && item.receiptDate)) {
    await expect(dialog.locator(`time[datetime="${receipt.receiptDate}"]`)).toBeVisible();
  }
  await expect(dialog.getByRole("button", { name: /Undo|Save date|Edit date|Propose receipt/ })).toHaveCount(0);
  await expect(dialog).toContainText("Receipt additions and corrections are made via PR by the collection owner.");
  await page.keyboard.press("Escape");
  await expect(tile).toBeFocused();
  await page.getByRole("searchbox").fill("1000");
  await expect(page.locator(".number-tile")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Enter a number from 000 to 999");
  await page.getByRole("button", { name: "Insights", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The story so far" })).toBeVisible();
  await expect(page.getByText("Timeline: receipt dates")).toBeVisible();
  if (expected.receiptProgress.length) {
    await page.getByText("View chart data", { exact: false }).click();
    const latest = expected.receiptProgress.at(-1)!;
    await expect(page.getByRole("cell", { name: latest.total.toLocaleString(), exact: true }).first()).toBeVisible();
  }
  await page.getByRole("button", { name: "Receipts", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The collection journal" })).toBeVisible();
  await expect(page.locator(".activity-list > li")).toHaveCount(expected.receipts.length);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Collection board/ })).toBeVisible();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("all sections are read-only and describe owner-managed receipt updates", async ({ page }) => {
  await page.goto("./");
  for (const section of ["The board", "Insights", "Receipts"]) {
    await page.getByRole("button", { name: section, exact: true }).click();
    await expect(page.locator(".static-notice")).toContainText("Receipts are added via PR by the collection owner.");
    await expect(page.getByRole("button", { name: /Prepare.*receipt|Propose.*receipt|Receipt PR|Generate CSV rows/i })).toHaveCount(0);
    await expect(page.locator("form")).toHaveCount(0);
  }
  const repo = repositoryUrl(process.env.CAFE_REPOSITORY_URL);
  if (repo) await expect(page.getByRole("link", { name: "Repository" })).toHaveAttribute("href", repo);
  else await expect(page.getByRole("link", { name: "Repository" })).toHaveCount(0);
  await expect(page.locator(".summary-card").filter({ hasText: "Total receipts" }).locator(".stat-value")).toHaveText(expected.stats.total.toLocaleString());
});

test("CSV download preserves the deployed counts and receipt dates", async ({ page }) => {
  await page.goto("./");
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe("cafe-1000.csv");
  const path = await file.path();
  expect(path).not.toBeNull();
  expect(parseCsv(readFileSync(path!, "utf8"), true)).toEqual(expected.receipts);
});

test("mobile browsing has no receipt-add controls and fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.getByRole("heading", { name: /Collection board/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("button")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Prepare.*receipt|Propose.*receipt|Receipt PR/i })).toHaveCount(0);
  await expect(page.locator(".static-notice")).toContainText("Receipts are added via PR by the collection owner.");
  await page.getByRole("searchbox", { name: "Find a receipt number" }).fill("7");
  const tile = page.locator(".number-tile");
  await tile.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button")).toHaveCount(1);
  await expect(dialog).toContainText("Receipt additions and corrections are made via PR by the collection owner.");
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(tile).toBeFocused();
});
