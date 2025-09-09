// Playwright smoke test for To-Do UI
import { test, expect } from '@playwright/test';
// Use dev server instead of file:// to match Playwright config

test('todo UI renders main elements', async ({ page }) => {
  await page.goto('/todo.html');

  await expect(page.getByRole('heading', { name: 'To-Do' })).toBeVisible();
  await expect(page.locator('#add-task-form')).toBeVisible();
  await expect(page.locator('#task-title')).toBeVisible();
  await expect(page.locator('#task-due')).toBeVisible();
  await expect(page.locator('#task-priority')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
  await expect(page.getByText('Filters')).toBeVisible();
  await expect(page.locator('#filter-due-today')).toBeVisible();
  await expect(page.locator('#filter-high-priority')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
  await expect(page.locator('#task-list')).toHaveCount(1);
});
