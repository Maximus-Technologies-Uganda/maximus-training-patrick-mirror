import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads
    await expect(page).toHaveTitle(/Vite \+ Vanilla/);

    // Check if the main content is visible
    const counterButton = page.locator('button');
    await expect(counterButton).toBeVisible();

    // Verify the initial counter value
    await expect(counterButton).toHaveText('count is 0');
  });

  test('should increment counter when clicked', async ({ page }) => {
    await page.goto('/');

    const counterButton = page.locator('button');

    // Click the button
    await counterButton.click();

    // Verify the counter incremented
    await expect(counterButton).toHaveText('count is 1');

    // Click again
    await counterButton.click();

    // Verify the counter incremented again
    await expect(counterButton).toHaveText('count is 2');
  });

  test('should have proper heading', async ({ page }) => {
    await page.goto('/');

    const heading = page.locator('h1');
    await expect(heading).toHaveText('Vite + Vanilla');
  });
});
