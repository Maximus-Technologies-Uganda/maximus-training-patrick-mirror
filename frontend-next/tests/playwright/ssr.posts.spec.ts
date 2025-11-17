import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "..", "..", "..");
const evidenceDir = path.join(repoRoot, "docs", "week-10", "playwright");

test.describe("SSR first-paint verification", () => {
  test("server-rendered posts content stays visible when JS is disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto("/api/health", { waitUntil: "domcontentloaded", timeout: 10000 });
      await page.goto("/posts", { waitUntil: "domcontentloaded", timeout: 60000 });
      const html = await page.content();

      fs.mkdirSync(evidenceDir, { recursive: true });
      fs.writeFileSync(path.join(evidenceDir, "posts-ssr-raw.html"), html, "utf-8");
      await page.screenshot({
        path: path.join(evidenceDir, "posts-ssr-first-paint.png"),
        fullPage: true,
      });

      expect(html).not.toContain("Loading posts");
      expect(html).toContain('<section aria-label="Posts list"');

      const hasTable = html.includes("<table");
      const hasEmptyState = html.includes('id="empty-state"');
      expect(hasTable || hasEmptyState).toBeTruthy();

      if (hasTable) {
        const rows = html.match(/<tr[\s\S]*?>/g) ?? [];
        expect(rows.length).toBeGreaterThan(0);
      }

      if (hasEmptyState) {
        expect(html).toContain("No posts yet");
      }
    } finally {
      await context.close();
    }
  });
});
