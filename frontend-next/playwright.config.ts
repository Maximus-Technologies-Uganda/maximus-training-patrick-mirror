import { defineConfig, devices } from "@playwright/test";
import path from "path";

function resolveCommitSha(): string {
  const candidates = [
    process.env.GITHUB_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.COMMIT_SHA,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return "local-dev";
}

const htmlReportDir = path.resolve(__dirname, "..", "a11y-frontend-next", resolveCommitSha());

// Align default with package.json dev script (next dev -p 3001)
const port = process.env.E2E_PORT || "3001";
const skipServer = process.env.E2E_SKIP_SERVER === "1";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  // Ignore Vitest tests; they are not Playwright tests
  testIgnore: ["**/contract.*.spec.ts", "**/idempotency.e2e.spec.ts"],
  // Start servers for E2E/a11y tests
  // In CI we do NOT start the API server to avoid missing dev deps; Next.js BFF routes fall back to local stubs
  webServer: (():
    | { command: string; url: string; reuseExistingServer: boolean; timeout: number }
    | Array<{ command: string; url: string; reuseExistingServer: boolean; timeout: number }>
    | undefined => {
    if (skipServer) return undefined;
    // Default: do NOT start API to avoid port conflicts and keep tests fast/stable.
    // Opt-in with E2E_START_API=1 locally if you explicitly want the API running.
    const startApi = !process.env.CI && process.env.E2E_START_API === "1";
    const servers: Array<{
      command: string;
      url: string;
      reuseExistingServer: boolean;
      timeout: number;
    }> = [];
    if (startApi) {
      // Note: API dev server defaults to PORT=3000. If you need to run it alongside the frontend
      // at a different port, start it manually with PORT set, then run tests with E2E_SKIP_SERVER=1.
      servers.push({
        command: "npm run dev --workspace=api",
        url: "http://localhost:3000/health",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      });
    }
    servers.push({
      command: `npm run dev --workspace=frontend-next -- --port=${port}`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    });
    return servers;
  })(),
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: htmlReportDir,
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
