import { test, expect } from '@playwright/test';

const EXPENSE_HTML = '/expense.html';

test.describe('Expense - edge behavior', () => {
  test.beforeEach(async ({ page }) => {
    // Mock expenses endpoint with a crafted dataset
    await page.route('../expense/expenses.json', async (route) => {
      const data = [
        { id: 1, amount: 10.001, category: 'groceries', date: '2025-01-01' },
        { id: 2, amount: 10 / 3, category: 'groceries', date: '2025-01-31' },
        { id: 3, amount: 20, category: 'transport', date: '2025-12-31' },
        { id: 4, amount: 5, category: 'transport', date: '2025-01-15' },
        { id: 5, amount: 0, category: 'utilities', date: '2025-02-01' },
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
    await page.goto(EXPENSE_HTML);
  });

  test('month parsing with case variants and invalid input', async ({
    page,
  }) => {
    // The UI uses <input type="month"> with canonical YYYY-MM, so simulate parsing by filling valid & invalid
    await page.fill('#month-filter', '2025-01');
    await page.waitForTimeout(50);
    const rowsJan = page.locator('#expenses-table tbody tr');
    await expect(rowsJan).toHaveCount(3);

    // Invalid format cannot be typed into input[type=month]; set programmatically
    await page.evaluate(() => {
      const el = document.querySelector('#month-filter');
      el.value = 'bogus';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(50);
    const rowsInvalid = page.locator('#expenses-table tbody tr');
    // Browsers coerce invalid value to empty for input[type=month]; expect all rows visible
    await expect(page.locator('#no-data')).toBeHidden();
    await expect(rowsInvalid).toHaveCount(5);
  });

  test('compound filtering by month and category', async ({ page }) => {
    await page.fill('#month-filter', '2025-01');
    await page.selectOption('#category-filter', 'groceries');
    await page.waitForTimeout(50);
    const rows = page.locator('#expenses-table tbody tr');
    await expect(rows).toHaveCount(2);
  });

  test('zero row rendering shows $0.00 total', async ({ page }) => {
    await page.fill('#month-filter', '2025-02');
    await page.selectOption('#category-filter', 'transport');
    await page.waitForTimeout(50);
    await expect(page.locator('#total-amount')).toHaveText('$0.00');
  });

  test('rounding precision to 2dp', async ({ page }) => {
    await page.fill('#month-filter', '2025-01');
    await page.selectOption('#category-filter', 'groceries');
    await page.waitForTimeout(50);
    const rows = page.locator('#expenses-table tbody tr');
    // Check a cell contains 3.33 (from 10/3)
    const last = rows.nth(1).locator('td').nth(3);
    await expect(last).toHaveText('$3.33');
  });

  test('date boundaries (first and last day of month/year)', async ({
    page,
  }) => {
    await page.fill('#month-filter', '2025-01');
    await page.waitForTimeout(50);
    const texts = await page
      .locator('#expenses-table tbody tr td:first-child')
      .allTextContents();
    expect(texts.join('\n')).toMatch(/Jan 1, 2025/);
    expect(texts.join('\n')).toMatch(/Jan 31, 2025/);
  });
});
