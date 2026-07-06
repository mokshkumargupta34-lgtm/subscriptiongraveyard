import { defineConfig } from "@playwright/test";

/* E2E against `next dev` with mocked Gmail + the dev-only e2e auth
   provider. Uses the installed Chrome — no browser download. */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 0,
  workers: 1,
  globalTeardown: "./e2e/teardown.ts",
  use: {
    baseURL: "http://localhost:3100",
    channel: "chrome",
    headless: true,
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100/login",
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      E2E_TEST: "1",
      GMAIL_MOCK: "1",
    },
  },
});
