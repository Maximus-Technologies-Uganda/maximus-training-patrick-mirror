import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./tests/playwright",
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
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
