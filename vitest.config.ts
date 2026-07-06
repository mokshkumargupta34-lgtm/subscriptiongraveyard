import { defineConfig } from "vitest/config";

/* Unit tests only — Playwright specs in e2e/ run via `npm run e2e`. */
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
