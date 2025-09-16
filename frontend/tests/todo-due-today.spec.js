import { test, expect } from '@playwright/test';

test('due-today filter works', async ({ page }) => {
  await page.goto('/todo.html');

  // Add two items: one today (default), one tomorrow
  await page.getByLabel('Title').fill('Today task');
  await page.getByRole('button', { name: 'Add' }).click();

  await page.getByLabel('Title').fill('Tomorrow task');
  // Pick tomorrow on date input
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate() + 1).padStart(2, '0');
  await page.locator('#task-due').fill(`${yyyy}-${mm}-${dd}`);
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.locator('li.task-item')).toHaveCount(2);

  // Apply filter
  await page.locator('#filter-due-type').selectOption('today');
  await expect(page.locator('li.task-item')).toHaveCount(1);
  await expect(page.locator('li.task-item').first()).toContainText('Today task');
});


