import { test, expect } from '@playwright/test';

test('keyboard-only: add -> toggle -> delete', async ({ page }) => {
  await page.goto('/todo.html');

  // Focus the document body and start tabbing to the Title field
  await page.focus('body');
  // Tab until #task-title gets focus (max 10 tabs)
  for (let i = 0; i < 10; i++) {
    const onTitle = await page.evaluate(
      () => document.activeElement?.id === 'task-title'
    );
    if (onTitle) break;
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('#task-title')).toBeFocused();

  // Type the title and press Enter to submit the form
  await page.keyboard.type('Keyboard Task');
  await page.keyboard.press('Enter');

  // New item appears
  const item = page
    .locator('li.task-item')
    .filter({ hasText: 'Keyboard Task' });
  await expect(item).toHaveCount(1);

  // Tab to the first task's checkbox (it should be the next focusable after Add returns focus to title input, so we tab to list region)
  // Focus should have returned to #task-title (explicit behavior)
  await expect(page.locator('#task-title')).toBeFocused();
  // Navigate to list by pressing Tab until the checkbox is focused
  for (let i = 0; i < 15; i++) {
    const onToggle = await page.evaluate(() =>
      document.activeElement?.classList?.contains('task-toggle')
    );
    if (onToggle) break;
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('.task-toggle').first()).toBeFocused();

  // Space to toggle
  await page.keyboard.press('Space');
  await expect(item).toHaveClass(/completed/);

  // Tab to Delete and press Enter to delete
  // Depending on focus order, Tab forward until the delete button is focused
  for (let i = 0; i < 5; i++) {
    const onDelete = await page.evaluate(() =>
      document.activeElement?.classList?.contains('task-delete')
    );
    if (onDelete) break;
    await page.keyboard.press('Tab');
  }
  await expect(page.locator('.task-delete').first()).toBeFocused();
  await page.keyboard.press('Enter');

  // List should be empty and focus should move to the list container (#task-list)
  await expect(page.locator('li.task-item')).toHaveCount(0);
  await expect(page.locator('#task-list')).toBeFocused();
});
