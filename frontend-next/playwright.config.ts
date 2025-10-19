import { defineConfig, devices } from "@playwright/test";
import path from "path";

const port = process.env.E2E_PORT || "3000";
const skipServer = process.env.E2E_SKIP_SERVER === "1";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  // Ignore Vitest contract tests; they are not Playwright tests
  testIgnore: ["**/contract.*.spec.ts"],
  // Start the Next.js app for E2E/a11y tests
  webServer: skipServer
    ? undefined
    : {
        command: `npm run dev -- --port=${port}`,
        url: `http://localhost:${port}`,
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
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`,
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
