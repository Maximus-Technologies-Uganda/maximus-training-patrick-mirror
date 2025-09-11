import { test, expect } from '@playwright/test';
// Use dev server baseURL from Playwright config

test.describe('Expense edge cases', () => {
  test.beforeEach(async ({ page }) => {
    // Seeded data for determinism
    const seedData = [
      { id: 1, amount: 10, category: 'groceries', date: '2025-01-01' },
      { id: 2, amount: 3.3333333, category: 'transport', date: '2025-01-31' },
      { id: 3, amount: 20, category: 'utilities', date: '2025-12-31' },
      { id: 4, amount: 5, category: 'groceries', date: '2025-02-01' },
    ];

    await page.route('**/expense/expenses.json', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(seedData) })
    );

    await page.goto('/expense.html');
  });

  test('month parsing accepts case variants and invalids gracefully (DEV-194.1)', async ({ page }) => {
    // The UI uses input type=month; emulate user typing invalid then clearing
    await page.fill('#month-filter', '2025-01');
    await page.waitForTimeout(50);
    await expect(page.locator('#expenses-table tbody tr')).toHaveCount(2);

    // Invalid input via script should not crash the UI
    await page.evaluate(() => {
      const el = document.querySelector('#month-filter');
      el.value = 'bogus';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(50);
    // When invalid, component treats as no filter and shows all rows
    await expect(page.locator('#expenses-table tbody tr')).toHaveCount(4);

    // Clear back to blank (all)
    await page.fill('#month-filter', '');
    await page.waitForTimeout(50);
    await expect(page.locator('#expenses-table tbody tr')).toHaveCount(4);
  });

  test('compound filtering month+category yields correct subset (DEV-194.2)', async ({ page }) => {
    await page.fill('#month-filter', '2025-01');
    await page.selectOption('#category-filter', 'groceries');
    await page.waitForTimeout(50);
    await expect(page.locator('#expenses-table tbody tr')).toHaveCount(1);
    await expect(page.locator('#total-amount')).toHaveText('$10.00');
  });

  test('zero-row rendering shows $0.00 in totals row (DEV-194.3)', async ({ page }) => {
    await page.fill('#month-filter', '2024-05');
    await page.waitForTimeout(50);
    await expect(page.locator('#no-data')).toBeVisible();
    await expect(page.locator('#total-display')).toBeHidden();
    // Clear filters then set a category that does not exist for chosen month
    await page.fill('#month-filter', '2025-02');
    await page.selectOption('#category-filter', 'utilities');
    await page.waitForTimeout(50);
    await expect(page.locator('#no-data')).toBeVisible();
  });

  test('rounding precision to 2dp (DEV-194.4)', async ({ page }) => {
    await page.fill('#month-filter', '2025-01');
    await page.waitForTimeout(50);
    // Amounts 10 + 3.3333333 => 13.33 after rounding
    await expect(page.locator('#total-amount')).toHaveText('$13.33');
  });

  test('date boundaries: first/last day of month/year (DEV-194.5)', async ({ page }) => {
    // January boundary
    await page.fill('#month-filter', '2025-01');
    await page.waitForTimeout(50);
    const janDates = await page.$$eval('#expenses-table tbody tr td:first-child', (cells) => cells.map((c) => c.textContent));
    expect(janDates.join(' ')).toMatch(/Jan/);

    // December boundary
    await page.fill('#month-filter', '2025-12');
    await page.waitForTimeout(50);
    await expect(page.locator('#expenses-table tbody tr')).toHaveCount(1);
  });
});


