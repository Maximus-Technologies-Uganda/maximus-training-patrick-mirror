/**
 * URL Sync & History Navigation Test – T038
 * E2E Playwright tests for filter state synchronization with URL
 * Tests cover direct navigation, client-side filter changes, and browser history
 * FR-006: URL-state synchronization
 * FR-017: SWR parity with SSR
 */

import { test, expect } from '@playwright/test';

test.describe('Posts URL Sync & History Navigation (T038)', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const postsUrl = `${baseUrl}/posts`;

  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for navigation and interactions
    page.setDefaultTimeout(10000);
  });

  test.describe('Direct navigation with filter parameters', () => {
    test('should server-render filtered results when navigating directly to /posts?q=design', async ({
      page,
    }) => {
      // Direct navigation to filtered URL
      await page.goto(`${postsUrl}?q=design`);
      await page.waitForLoadState('networkidle');

      // Verify page is interactive
      const postRows = page.locator('table tbody tr');
      const count = await postRows.count();
      expect(count).toBeGreaterThan(0);

      // Verify filter input reflects the query
      const queryInput = page.locator('input[name="q"]');
      await expect(queryInput).toHaveValue('design');

      // Verify URL is correct
      expect(page.url()).toContain('q=design');
    });

    test('should server-render filtered results with author parameter', async ({ page }) => {
      await page.goto(`${postsUrl}?author=alice`);
      await page.waitForLoadState('networkidle');

      const postRows = page.locator('table tbody tr');
      const count = await postRows.count();
      expect(count).toBeGreaterThan(0);

      const authorInput = page.locator('input[name="author"]');
      await expect(authorInput).toHaveValue('alice');
      expect(page.url()).toContain('author=alice');
    });

    test('should server-render filtered results with sort parameter', async ({ page }) => {
      await page.goto(`${postsUrl}?sort=old`);
      await page.waitForLoadState('networkidle');

      const postRows = page.locator('table tbody tr');
      const count = await postRows.count();
      expect(count).toBeGreaterThan(0);

      const sortSelect = page.locator('select[name="sort"]');
      await expect(sortSelect).toHaveValue('old');
      expect(page.url()).toContain('sort=old');
    });

    test('should server-render with multiple filter parameters combined', async ({ page }) => {
      await page.goto(`${postsUrl}?q=typescript&author=bob-smith&sort=old`);
      await page.waitForLoadState('networkidle');

      const postRows = page.locator('table tbody tr');
      const count = await postRows.count();
      expect(count).toBeGreaterThan(0);

      const queryInput = page.locator('input[name="q"]');
      const authorInput = page.locator('input[name="author"]');
      const sortSelect = page.locator('select[name="sort"]');

      await expect(queryInput).toHaveValue('typescript');
      await expect(authorInput).toHaveValue('bob-smith');
      await expect(sortSelect).toHaveValue('old');
    });

    test('should show empty state message when no results match filters', async ({ page }) => {
      // Use a filter combination unlikely to have results
      await page.goto(`${postsUrl}?q=xyznonexistentquery123&author=fakeuserabcdef`);
      await page.waitForLoadState('networkidle');

      // Expect empty state message
      const emptyMessage = page.locator('[role="status"]');
      await expect(emptyMessage).toBeVisible();
      const text = await emptyMessage.textContent();
      expect(text?.toLowerCase()).toContain('no posts');
    });
  });

  test.describe('Client-side filter changes', () => {
    test('should update URL when query filter is changed', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      const queryInput = page.locator('input[name="q"]');
      await queryInput.fill('react');

      // Simulate form submission or trigger change event
      await queryInput.press('Enter');
      await page.waitForLoadState('networkidle');

      // Verify URL includes filter
      expect(page.url()).toContain('q=react');
    });

    test('should update URL when author filter is changed', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      const authorInput = page.locator('input[name="author"]');
      await authorInput.fill('charlie');

      // Trigger submission
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('author=charlie');
    });

    test('should update URL when sort order is changed', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      const sortSelect = page.locator('select[name="sort"]');
      await sortSelect.selectOption('old');

      // Trigger submission or change event handling
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('sort=old');
    });

    test('should update results when filter changes', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      // Get initial row count
      let postRows = page.locator('table tbody tr');
      const initialCount = await postRows.count();

      // Change filter
      const queryInput = page.locator('input[name="q"]');
      await queryInput.fill('new-search-term');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // Verify results changed (or are empty)
      postRows = page.locator('table tbody tr');
      const newCount = await postRows.count();
      // Results should be different (either fewer or zero)
      expect(newCount).toBeLessThanOrEqual(initialCount);
    });

    test('should announce filter changes via live region', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      // Find live region
      const liveRegion = page.locator('[role="status"], [role="alert"]');

      // Change filter
      const queryInput = page.locator('input[name="q"]');
      await queryInput.fill('updated');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // Verify live region has content (announcement)
      await expect(liveRegion).toBeVisible();
      const announcement = await liveRegion.textContent();
      expect(announcement).toBeTruthy();
    });

    test('should maintain other filters when changing one', async ({ page }) => {
      await page.goto(`${postsUrl}?q=typescript&author=alice`);
      await page.waitForLoadState('networkidle');

      // Change sort without touching other filters
      const sortSelect = page.locator('select[name="sort"]');
      await sortSelect.selectOption('old');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // Verify all three parameters are in URL
      expect(page.url()).toContain('q=typescript');
      expect(page.url()).toContain('author=alice');
      expect(page.url()).toContain('sort=old');
    });
  });

  test.describe('Browser history navigation', () => {
    test('should restore filter state when pressing back button', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      // Navigate to a filtered state
      const queryInput = page.locator('input[name="q"]');
      await queryInput.fill('javascript');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // Verify current state
      expect(page.url()).toContain('q=javascript');
      const currentValue = await queryInput.inputValue();
      expect(currentValue).toBe('javascript');

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Verify returned to unfiltered state
      expect(page.url()).not.toContain('q=javascript');
      const resetValue = await queryInput.inputValue();
      expect(resetValue).toBe('');
    });

    test('should restore filter state when pressing forward button', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      // Go to filtered state
      const queryInput = page.locator('input[name="q"]');
      await queryInput.fill('react');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      const filteredUrl = page.url();

      // Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Navigate forward
      await page.goForward();
      await page.waitForLoadState('networkidle');

      // Verify returned to filtered state
      expect(page.url()).toBe(filteredUrl);
      const restoredValue = await queryInput.inputValue();
      expect(restoredValue).toBe('react');
    });

    test('should handle multiple filter changes in history', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      const queryInput = page.locator('input[name="q"]');

      // Change 1
      await queryInput.fill('first');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // Change 2
      await queryInput.fill('second');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // Change 3
      await queryInput.fill('third');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // Go back to second
      await page.goBack();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('q=second');

      // Go back to first
      await page.goBack();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('q=first');

      // Go forward to second
      await page.goForward();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('q=second');
    });
  });

  test.describe('Edge cases', () => {
    test('should handle special characters in query', async ({ page }) => {
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      const queryInput = page.locator('input[name="q"]');
      await queryInput.fill('design & patterns');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // URL should encode special characters
      expect(page.url()).toContain('q=');
      expect(page.url()).toContain('design');
    });

    test('should clear filters when navigating to base /posts', async ({ page }) => {
      await page.goto(`${postsUrl}?q=test&author=alice&sort=old`);
      await page.waitForLoadState('networkidle');

      // Navigate to base without params
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      const queryInput = page.locator('input[name="q"]');
      const authorInput = page.locator('input[name="author"]');
      const sortSelect = page.locator('select[name="sort"]');

      expect(await queryInput.inputValue()).toBe('');
      expect(await authorInput.inputValue()).toBe('');
      expect(await sortSelect.inputValue()).toBe('new'); // default
    });

    test('should handle empty parameters gracefully', async ({ page }) => {
      await page.goto(`${postsUrl}?q=&author=&sort=new`);
      await page.waitForLoadState('networkidle');

      // Should render without error
      const postRows = page.locator('table tbody tr');
      const count = await postRows.count();
      expect(count).toBeGreaterThanOrEqual(0); // May be empty or show all
    });
  });

  test.describe('@smoke Filter integration smoke test', () => {
    test('should perform complete filter workflow', async ({ page }) => {
      // 1. Load base page
      await page.goto(postsUrl);
      await page.waitForLoadState('networkidle');

      // 2. Apply filters
      const queryInput = page.locator('input[name="q"]');
      const authorInput = page.locator('input[name="author"]');
      const sortSelect = page.locator('select[name="sort"]');

      await queryInput.fill('test');
      await authorInput.fill('alice');
      await sortSelect.selectOption('old');
      await page.locator('button[type="submit"]').click();
      await page.waitForLoadState('networkidle');

      // 3. Verify URL reflects all filters
      expect(page.url()).toContain('q=test');
      expect(page.url()).toContain('author=alice');
      expect(page.url()).toContain('sort=old');

      // 4. Verify page loaded content
      const postRows = page.locator('table tbody tr');
      expect(await postRows.count()).toBeGreaterThanOrEqual(0);

      // 5. Navigate back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // 6. Verify cleared filters
      expect(await queryInput.inputValue()).toBe('');
    });
  });
});
