import { expect, test } from "@playwright/test";

test.describe("Posts initial load", () => {
  test("renders server HTML within 2s performance budget", async ({ page }) => {
    // Capture Server-Timing header to measure SSR time (excluding network latency)
    let serverTimingHeader: string | null = null;
    page.on("response", (response) => {
      if (response.url().includes("/posts")) {
        serverTimingHeader = response.headers()["server-timing"] || null;
      }
    });

    await page.goto("/posts", { waitUntil: "domcontentloaded" });

    // Parse SSR duration from Server-Timing header
    expect(serverTimingHeader).toBeTruthy();
    const ssrMatch = serverTimingHeader?.match(/ssr;dur=(\d+(?:\.\d+)?)/);
    expect(ssrMatch).toBeTruthy();
    const ssrDuration = parseFloat(ssrMatch![1]);

    // Assert SSR server render time < 2000ms (excluding network latency)
    expect(ssrDuration).toBeLessThan(2000);

    await expect(page.getByRole("heading", { level: 1, name: "Posts" })).toBeVisible();

    const html = await page.content();
    expect(html).not.toContain("Loading…");

    const listItems = page.locator("section[aria-label='Posts list'] li");
    expect(await listItems.count()).toBeGreaterThan(0);
  });

  test("user can change sort order via dropdown", async ({ page }) => {
    await page.goto("/posts");

    const sortSelect = page.locator('select[aria-label="Sort posts"]');
    await expect(sortSelect).toBeVisible();
    await expect(sortSelect).toHaveValue("date-desc");

    await sortSelect.selectOption("title-asc");
    await page.waitForURL((url) => url.searchParams.get("sort") === "title-asc");
    await expect(sortSelect).toHaveValue("title-asc");

    await expect(page.locator("section[aria-label='Posts list'] li").first()).toBeVisible();
  });
});
