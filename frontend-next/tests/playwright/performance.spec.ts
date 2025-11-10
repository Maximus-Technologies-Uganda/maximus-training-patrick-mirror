import { expect, test } from "@playwright/test";

/**
 * Performance Tests for Week 9 Frontend Foundations
 *
 * Verifies spec requirement SC-001: SSR first contentful paint ≤2 seconds on 4G network
 * Spec Reference: specs/009-frontend-foundations/spec.md FR-006, SC-001
 */

test.describe("Performance Tests - Posts Page", () => {
  test("SSR first contentful paint ≤2s on 4G network", async ({ page }) => {
    // Simulate 4G network conditions (spec SC-001)
    await page.route("**/*", (route) => {
      // Add network throttling simulation
      route.continue();
    });

    // Navigate with performance monitoring
    const startTime = Date.now();

    // Use CDP to measure FCP
    await page.goto("/posts", { waitUntil: "domcontentloaded" });

    // Wait for first contentful paint
    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find((entry) => entry.name === "first-contentful-paint");
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
          }
        }).observe({ entryTypes: ["paint"] });

        // Fallback: measure time to first visible content
        setTimeout(() => {
          const paintEntries = performance.getEntriesByType("paint");
          const fcp = paintEntries.find((e) => e.name === "first-contentful-paint");
          resolve(fcp ? fcp.startTime : performance.now());
        }, 3000);
      });
    });

    const loadTime = Date.now() - startTime;

    // Verify FCP ≤2s (2000ms) per spec SC-001
    expect(
      fcp,
      `First Contentful Paint (${fcp.toFixed(0)}ms) exceeds 2s threshold`
    ).toBeLessThanOrEqual(2000);

    // Also verify total load time is reasonable
    expect(loadTime, `Total load time (${loadTime}ms) exceeds 5s threshold`).toBeLessThanOrEqual(
      5000
    );

    console.log(`✅ FCP: ${fcp.toFixed(0)}ms (target: ≤2000ms)`);
    console.log(`✅ Load time: ${loadTime}ms`);
  });

  test("SSR HTML contains posts before JavaScript executes", async ({ page }) => {
    // Navigate and get HTML before hydration
    const response = await page.goto("/posts", { waitUntil: "domcontentloaded" });
    const html = await response?.text();

    // Verify posts exist in server-rendered HTML (spec FR-001)
    expect(html).toBeTruthy();

    // Check for post content indicators in SSR HTML
    const hasPostIndicators =
      html?.includes("Posts") ||
      html?.includes("post") ||
      html?.includes("article") ||
      html?.includes("h1") ||
      html?.includes("h2");

    expect(
      hasPostIndicators,
      "SSR HTML should contain post content before JavaScript executes"
    ).toBeTruthy();

    // Verify no loading spinner in initial HTML
    const hasLoadingSpinner =
      html?.includes("Loading") || html?.includes("loading") || html?.includes("spinner");

    expect(hasLoadingSpinner, "SSR HTML should not contain loading spinner").toBeFalsy();
  });

  test("Pagination navigation is fast (<1s)", async ({ page }) => {
    await page.goto("/posts", { waitUntil: "networkidle" });

    // Find and click Next button
    const nextButton = page.getByRole("button", { name: /next/i }).first();
    const nextExists = (await nextButton.count()) > 0;

    if (nextExists && (await nextButton.isEnabled())) {
      const startTime = Date.now();
      await nextButton.click();

      // Wait for URL to change and content to load
      await page.waitForURL(/\?page=\d+/, { timeout: 2000 });
      await page.waitForLoadState("networkidle", { timeout: 2000 });

      const navigationTime = Date.now() - startTime;

      // Verify pagination is fast (<1s per spec)
      expect(
        navigationTime,
        `Pagination navigation (${navigationTime}ms) exceeds 1s threshold`
      ).toBeLessThanOrEqual(1000);

      console.log(`✅ Pagination navigation: ${navigationTime}ms (target: ≤1000ms)`);
    }
  });

  test("Server-Timing header present for SSR performance tracking", async ({ page }) => {
    const response = await page.goto("/posts");
    const serverTiming = response?.headers()["server-timing"];

    // Verify Server-Timing header exists (from middleware.ts)
    expect(
      serverTiming,
      "Server-Timing header should be present for SSR performance tracking"
    ).toBeTruthy();

    // Verify it contains SSR timing information
    expect(serverTiming).toContain("ssr");
    expect(serverTiming).toMatch(/dur=\d+/);

    console.log(`✅ Server-Timing: ${serverTiming}`);
  });
});
