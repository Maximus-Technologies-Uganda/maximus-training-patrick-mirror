import { test, expect } from '@playwright/test';

test('happy path: add → toggle → delete', async ({ page }) => {
  await page.goto('/todo.html');

  await page.getByLabel('Title').fill('Pay rent');
  // Due date defaults to today; leave as is
  await page.getByRole('button', { name: 'Add' }).click();

  // Item appears
  const item = page.locator('li.task-item').filter({ hasText: 'Pay rent' });
  await expect(item).toHaveCount(1);

  // Toggle complete
  await item.locator('.task-toggle').check();
  await expect(item).toHaveClass(/completed/);

  // Delete
  await item.locator('.task-delete').click();
  await expect(page.locator('li.task-item')).toHaveCount(0);
});


