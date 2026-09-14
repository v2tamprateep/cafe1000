import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeBasePath, repositoryUrl } from "./site.ts";

test("static base paths support root and project hosting", () => {
  assert.equal(normalizeBasePath(), "");
  assert.equal(normalizeBasePath("/"), "");
  assert.equal(normalizeBasePath("/cafe-1000/"), "/cafe-1000");
  assert.equal(normalizeBasePath("/team/cafe_1000"), "/team/cafe_1000");
  for (const value of ["cafe-1000", "//example.com", "/../cafe", "/cafe?x=1", "/cafe#board", "/cafe\\1000", "/cafe//1000"]) {
    assert.throws(() => normalizeBasePath(value), /CAFE_BASE_PATH/);
  }
});

test("repository links are optional HTTPS URLs, never credentials or script URLs", () => {
  assert.equal(repositoryUrl(), null);
  assert.equal(repositoryUrl("https://github.com/team/cafe-1000/"), "https://github.com/team/cafe-1000");
  assert.equal(repositoryUrl("https://dev.azure.com/team/project/_git/cafe-1000"), "https://dev.azure.com/team/project/_git/cafe-1000");
  for (const value of ["javascript:alert(1)", "http://example.com", "https://user:secret@example.com",
    "https://example.com?token=secret", "https://example.com#access=secret", "not a URL"]) {
    assert.throws(() => repositoryUrl(value));
  }
});
