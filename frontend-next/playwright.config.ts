import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  // Ignore Vitest contract tests; they are not Playwright tests
  testIgnore: ["**/contract.*.spec.ts"],
  // Start the Next.js app for E2E/a11y tests
  webServer: {
    command: "npm run dev -- --port=3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        // Persist HTML report into Review Packet path per T033 (tasks.md)
        outputFolder: path.resolve(__dirname, "..", "docs", "ReviewPacket", "a11y", "html"),
      },
    ],
  ],
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
