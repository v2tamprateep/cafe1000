import { defineConfig } from "@playwright/test";
import nextEnv from "@next/env";
import { normalizeBasePath } from "./src/lib/site";

nextEnv.loadEnvConfig(process.cwd(), false);
const baseURL = `http://127.0.0.1:3107${normalizeBasePath(process.env.CAFE_BASE_PATH)}/`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  use: {
    actionTimeout: 10_000,
    baseURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start -- --port 3107",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
});
