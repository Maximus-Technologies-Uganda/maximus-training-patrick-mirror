import { expect, test } from "@playwright/test";

test.describe("Posts initial load", () => {
  test("renders server HTML within 2s performance budget", async ({ page }) => {
    const start = Date.now();
    await page.goto("/posts", { waitUntil: "domcontentloaded" });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);

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
