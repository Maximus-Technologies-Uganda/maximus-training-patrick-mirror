import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("/posts screenshots (Loading → Data)", () => {
  test("capture loading and loaded states", async ({ page }) => {
    // Intercept the posts list request to force a brief loading state, then return demo data
    await page.route("**/api/posts*", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      const now = new Date().toISOString();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          page: 1,
          pageSize: 10,
          hasNextPage: false,
          items: [
            {
              id: "demo-1",
              title: "Demo Post",
              content: "This is a demo post used for screenshot capture.",
              tags: [],
              published: true,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }),
      });
    });

    // Navigate to posts page and wait for the static heading
    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible({ timeout: 7000 });

    // Capture a loading snapshot shortly after navigation (before the mocked response completes)
    // We intentionally avoid asserting on the loading text to prevent flakiness across render timings
    await page.waitForTimeout(350);

    // Ensure the screenshots directory exists relative to repo root per tasks.md (T016)
    const repoRoot = path.resolve(__dirname, "..", "..", "..");
    const outDir = path.join(
      repoRoot,
      "docs",
      "ReviewPacket",
      "screenshots",
      "frontend-next",
    );
    fs.mkdirSync(outDir, { recursive: true });

    // Capture the loading state (we delayed the response above)
    await page.screenshot({ path: path.join(outDir, "posts-loading.png"), fullPage: true });

    // Give enough time for the delayed route (1500ms) to resolve and UI to render
    await page.waitForTimeout(1800);
    // Assert a unique element for the loaded state to avoid strict mode violations
    const demoHeading = page.getByRole("heading", { name: "Demo Post" });
    await expect(demoHeading).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(outDir, "posts-loaded.png"), fullPage: true });
  });
});


