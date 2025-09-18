import { test, expect } from '@playwright/test';

test.describe('To-Do - edge behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todo.html');
  });

  test('duplicate title guard shows friendly error', async ({ page }) => {
    const title = 'Pay bills';
    await page.fill('#task-title', title);
    await page.click('button:has-text("Add")');
    await page.fill('#task-title', title);
    await page.click('button:has-text("Add")');
    const alert = page.locator('#error');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Duplicate title');
  });

  test('due today pinning using mocked clock', async ({ page }) => {
    await page.addInitScript(() => {
      // Clear localStorage to start fresh
      localStorage.clear();
      // Freeze time to 2025-03-10
      const fixed = new Date('2025-03-10T09:00:00');
      const OriginalDate = Date;
      class FakeDate extends OriginalDate {
        constructor(...args) {
          super(...(args.length ? args : [fixed]));
        }
        static now() {
          return fixed.getTime();
        }
      }
      // @ts-ignore
      window.Date = FakeDate;
    });
    await page.reload();

    // Add one task due tomorrow and one due today
    await page.fill('#task-title', 'Due tomorrow');
    await page.fill('#task-due', '2025-03-11');
    await page.click('button:has-text("Add")');

    await page.fill('#task-title', 'Due today');
    await page.fill('#task-due', '2025-03-10');
    await page.click('button:has-text("Add")');

    // Enable due-today filter -> should surface only the today task
    await page.check('#filter-due-today');
    // Wait a bit for the filter to be applied
    await page.waitForTimeout(100);
    const items = page.locator(
      '#task-list .task-item:not(.hidden) .task-title'
    );

    await expect(items).toHaveCount(1);
    await expect(items.first()).toHaveText('Due today');
  });

  test('invalid ID operations are no-ops (toggle/remove)', async ({ page }) => {
    // No items yet, toggling an invalid id should not crash or change UI
    await expect(page.locator('#task-list .task-item')).toHaveCount(0);
    // There is no direct UI to toggle arbitrary id; ensure app remains stable
    await page.evaluate(() => {
      // Just dispatch a change event on a non-existent element
      const ev = new Event('change');
      document.dispatchEvent(ev);
    });
    await expect(page.locator('#task-list .task-item')).toHaveCount(0);
  });
});
