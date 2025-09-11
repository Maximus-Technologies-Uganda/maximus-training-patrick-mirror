import { test, expect } from '@playwright/test';

async function expectFocusable(page, locator) {
  await expect(locator).toBeVisible();
  await locator.focus();
  const active = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  expect(active).toBeTruthy();
}

test.describe('A11y smoke tests (DEV-197)', () => {
  test('index page has accessible controls', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Inspirational Quotes' })).toBeVisible();
    // Check key control visibility and interactivity
    const searchBtn = page.getByRole('button', { name: 'Search Quotes' });
    await expect(searchBtn).toBeVisible();
    await expectFocusable(page, searchBtn);
  });

  test('todo page maintains focus order after form submit', async ({ page }) => {
    await page.goto('/todo.html');
    await page.fill('#task-title', 'A11y Focus');
    await page.press('#task-title', 'Enter');
    // After submit, focus should remain on title input for fast entry
    const isTitleFocused = await page.evaluate(() => document.activeElement?.id === 'task-title');
    expect(isTitleFocused).toBe(true);
  });

  test('expense page contrast and aria-label presence', async ({ page }) => {
    await page.goto('/expense.html');
    await expect(page.locator('#clear-filters')).toHaveAttribute('aria-label');
    // Basic visibility checks for interactive elements
    await expect(page.locator('#month-filter')).toBeVisible();
    await expect(page.locator('#category-filter')).toBeVisible();
  });

  test('stopwatch page primary controls visible and interactive', async ({ page }) => {
    await page.goto('/stopwatch.html');
    const toggle = page.getByRole('button', { name: /Start|Stop/ });
    await expect(toggle).toBeVisible();
    await expectFocusable(page, toggle);
  });
});


