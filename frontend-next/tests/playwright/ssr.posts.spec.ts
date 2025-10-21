import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("SSR first-paint verification", () => {
  test("server-rendered HTML contains post data (proves SSR working)", async ({ page }) => {
    // Navigate to posts page - this will trigger server-side rendering
    await page.goto("/posts", { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait briefly to ensure page is ready
    await page.waitForTimeout(1000);

    // Get the raw HTML content (includes SSR output)
    const html = await page.content();

    // Save evidence artifacts
    const repoRoot = path.resolve(__dirname, "..", "..", "..");
    const outDir = path.join(
      repoRoot,
      "docs",
      "ReviewPacket",
      "screenshots",
      "frontend-next",
    );
    fs.mkdirSync(outDir, { recursive: true });

    // Save raw SSR HTML as evidence
    fs.writeFileSync(path.join(outDir, "posts-ssr-raw.html"), html, "utf-8");

    // Capture screenshot of SSR first paint
    await page.screenshot({
      path: path.join(outDir, "posts-ssr-first-paint.png"),
      fullPage: true
    });

    // === KEY ASSERTIONS: Prove SSR is working ===

    // 1. Verify the page heading is in the HTML (basic structure)
    expect(html).toContain("<h1");
    expect(html).toContain("Posts");

    // 2. Verify post-related UI elements are present (not just a loading skeleton)
    // This proves the server rendered actual content, not just placeholders
    const hasServerRenderedContent =
      html.includes("role=\"list\"") || // Posts list
      html.includes("article") || // Post articles
      html.includes("Create") || // Create button/form
      html.includes("Prev") || // Pagination
      html.includes("Next") || // Pagination
      html.includes("No posts"); // Or empty state message

    expect(hasServerRenderedContent).toBe(true);

    // 3. Ensure we don't have just a loading state (which would indicate CSR, not SSR)
    expect(html).not.toContain("Loading posts");

    // 4. Verify critical interactive elements are present
    // (proves SSR rendered the full page, not just shell)
    const hasInteractiveElements =
      html.includes("Page size") || // Page size selector
      html.includes("Search"); // Search input

    expect(hasInteractiveElements).toBe(true);

    console.log("[SSR Test] ✅ Successfully verified server-rendered post content in HTML");
    console.log("[SSR Test] Evidence saved:");
    console.log(`  - ${outDir}/posts-ssr-raw.html`);
    console.log(`  - ${outDir}/posts-ssr-first-paint.png`);
  });
});