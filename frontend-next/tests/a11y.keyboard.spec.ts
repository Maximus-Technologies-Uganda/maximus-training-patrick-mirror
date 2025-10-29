import { expect, test, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { promises as fs } from "fs";
import path from "path";

const ARTIFACT_ROOT = path.resolve(__dirname, "..", "..", "a11y-frontend-next");

function resolveCommitSha(): string {
  const candidates = [process.env.GITHUB_SHA, process.env.VERCEL_GIT_COMMIT_SHA, process.env.COMMIT_SHA];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return "local-dev";
}

async function ensureArtifactDir(): Promise<string> {
  const dir = path.join(ARTIFACT_ROOT, resolveCommitSha());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

test.use({
  video: { mode: "on", size: { width: 1280, height: 720 } },
});

async function tabUntil(page: Page, predicate: () => Promise<boolean>, limit = 20): Promise<void> {
  for (let i = 0; i < limit; i += 1) {
    if (await predicate()) {
      return;
    }
    await page.keyboard.press("Tab");
  }
  throw new Error("Failed to focus target element using keyboard navigation");
}

test.describe("keyboard-only navigation", () => {
  test("produces keyboard video and a11y report", async ({ page }, testInfo: TestInfo) => {
    await page.route("**/api/posts**", async (route) => {
      const url = new URL(route.request().url());
      const pageParam = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
      const payload = {
        page: pageParam,
        pageSize: 10,
        hasNextPage: pageParam < 2,
        items: [
          {
            id: `post-${pageParam}`,
            title: `Keyboard accessible post ${pageParam}`,
            content: "Demonstrates keyboard navigation.",
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ownerId: "owner-1",
            ownerName: "Owner One",
            permissions: { canEdit: false, canDelete: false },
          },
        ],
      } satisfies Record<string, unknown>;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("main")).toBeVisible();

    await page.focus("body");
    await tabUntil(
      page,
      () =>
        page.evaluate(() => {
          const active = document.activeElement;
          return Boolean(active?.getAttribute("aria-label") === "Search");
        }),
    );
    await expect(page.getByLabel("Search")).toBeFocused();

    await page.keyboard.type("keyboard");

    const nextButton = page.getByRole("button", { name: "Next page" });
    await tabUntil(
      page,
      () =>
        page.evaluate(() => {
          const active = document.activeElement;
          return Boolean(active?.getAttribute("aria-label") === "Next page");
        }),
    );
    await expect(nextButton).toBeFocused();
    await page.keyboard.press("Space");

    await expect(page.getByText("Page 2")).toBeVisible();

    const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    const results = await axe.analyze();
    expect(results.violations, results.violations.map((v) => v.id).join(", ")).toEqual([]);

    const artifactDir = await ensureArtifactDir();

    await fs.mkdir(testInfo.outputDir, { recursive: true });

    const tempJsonPath = path.join(testInfo.outputDir, "axe-results.json");
    await fs.writeFile(tempJsonPath, JSON.stringify({ violations: results.violations }, null, 2) + "\n", "utf8");
    const jsonPath = path.join(artifactDir, "axe-results.json");
    await fs.copyFile(tempJsonPath, jsonPath);
    await testInfo.attach("axe-results", { path: tempJsonPath, contentType: "application/json" });

    const video = page.video();
    await page.close();
    expect(video, "Expected Playwright to record a video for keyboard-only navigation").not.toBeNull();
    const videoPath = await video!.path();
    const dest = path.join(artifactDir, "keyboard-only.webm");
    await fs.copyFile(videoPath, dest);
    await testInfo.attach("keyboard-navigation-video", { path: videoPath, contentType: "video/webm" });
  });
});
