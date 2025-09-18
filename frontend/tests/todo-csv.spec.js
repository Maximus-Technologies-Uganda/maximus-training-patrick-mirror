import { test, expect } from '@playwright/test';

test('CSV export link exists with filename', async ({ page }) => {
  await page.goto('/todo.html');
  await expect(page.locator('#export-csv')).toBeVisible();
  await expect(page.locator('#export-csv')).toHaveAttribute(
    'download',
    /todos\.csv/
  );

  // Adding an item should update data URL
  await page.getByLabel('Title').fill('CSV item');
  await page.getByRole('button', { name: 'Add' }).click();
  const href = await page.locator('#export-csv').getAttribute('href');
  const decoded = decodeURIComponent(href.split(',')[1] || '');
  expect(href).toMatch(/^data:text\/csv/);
  // Ensure BOM prefix for Excel compatibility
  expect(decoded.charCodeAt(0)).toBe(0xfeff);
});
