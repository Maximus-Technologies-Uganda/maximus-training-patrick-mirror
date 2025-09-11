import { test, expect } from '@playwright/test';

test.describe('A11y smoke - primary pages', () => {
  test('index: key controls visible and interactive', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Inspirational Quotes' })).toBeVisible();
    const button = page.getByRole('button', { name: 'Search Quotes' });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });

  test('todo: aria labels on inputs', async ({ page }) => {
    await page.goto('/todo.html');
    await expect(page.getByRole('heading', { name: 'To-Do' })).toBeVisible();
    await expect(page.locator('#task-title')).toHaveAttribute('aria-label', 'Task title');
    await expect(page.locator('#task-due')).toHaveAttribute('aria-label', 'Due date');
  });

  test('expense: controls reachable and contrast check placeholder', async ({ page }) => {
    await page.goto('/expense.html');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.locator('#month-filter')).toBeVisible();
    await expect(page.locator('#category-filter')).toBeVisible();
    await expect(page.locator('#clear-filters')).toBeVisible();
  });
});
