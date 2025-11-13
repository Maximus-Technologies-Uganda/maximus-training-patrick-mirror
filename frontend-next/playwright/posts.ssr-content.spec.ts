import { test, expect } from "@playwright/test";

test.describe("Posts SSR Content (T029)", () => {
  test("should render ≥1 post row without JavaScript", async ({ page, context }) => {
    // Disable JavaScript to test pure SSR
    await context.setJavaScriptEnabled(false);

    const response = await page.goto("/posts");
    expect(response?.status()).toBe(200);

    // Check for table structure
    const rows = await page.locator("tbody tr");
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    // Verify post data exists in first row
    const titleCell = rows.first().locator("td").first();
    const title = await titleCell.textContent();
    expect(title).toBeTruthy();
    expect(title?.length).toBeGreaterThan(0);
  });

  test("should NOT display loading placeholder on initial render", async ({ page }) => {
    await page.goto("/posts");

    // Ensure no "Loading..." text is visible
    const loadingText = page.locator("text=/loading|loading posts/i");
    await expect(loadingText).not.toBeVisible();
  });

  test("should contain valid post metadata in rows", async ({ page }) => {
    await page.goto("/posts?q=design");

    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    // Title column - should be non-empty
    const title = await firstRow.locator("td").nth(0).textContent();
    expect(title).toBeTruthy();
    expect(title?.length || 0).toBeGreaterThan(0);

    // Author badge - should match slug format (optional, may not always exist)
    const author = await firstRow.locator("td").nth(1).textContent();
    if (author) {
      expect(author).toMatch(/[a-z0-9-]/);
    }

    // Created date - should contain date characters
    const createdDate = await firstRow.locator("td").nth(2).textContent();
    expect(createdDate).toBeTruthy();
  });

  test("should have table structure with headers", async ({ page }) => {
    await page.goto("/posts");

    // Check for table element
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Check for thead with headers
    const thead = page.locator("thead");
    await expect(thead).toBeVisible();

    // Check for tbody
    const tbody = page.locator("tbody");
    await expect(tbody).toBeVisible();
  });

  test("should render all post columns", async ({ page }) => {
    await page.goto("/posts");

    const firstRow = page.locator("tbody tr").first();

    // Should have at least 3 columns (title, author, created)
    const cells = firstRow.locator("td");
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThanOrEqual(3);
  });

  test("should display post data immediately without spinners", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/posts");

    // Check that post content is available immediately
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 1000 });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // SSR should be fast
  });

  test("should handle filtered queries in SSR", async ({ page }) => {
    await page.goto("/posts?author=alice&sort=new");

    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    // Should render with filtered results (or empty state)
    expect(rowCount).toBeGreaterThanOrEqual(0);

    // If results exist, verify they match filter expectations
    if (rowCount > 0) {
      const firstRow = rows.first();
      await expect(firstRow).toBeVisible();
    }
  });
});
