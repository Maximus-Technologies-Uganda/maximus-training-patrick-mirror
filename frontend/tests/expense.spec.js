import { test, expect } from '@playwright/test';
import path from 'path';

const EXPENSE_HTML_PATH = path.join(process.cwd(), 'frontend/expense.html');

test.describe('Expense Tracker Frontend - Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Set up a mock server response for expenses data
        await page.route('../expense/expenses.json', async route => {
            const mockExpenses = [
                {
                    id: 1,
                    amount: 10,
                    category: 'groceries',
                    date: '2025-01-02'
                },
                {
                    id: 2,
                    amount: 15,
                    category: 'transport',
                    date: '2025-01-15'
                },
                {
                    id: 3,
                    amount: 7.5,
                    category: 'groceries',
                    date: '2025-02-03'
                },
                {
                    id: 4,
                    amount: 20,
                    category: 'utilities',
                    date: '2025-02-20'
                },
                {
                    id: 5,
                    amount: 5,
                    category: 'transport',
                    date: '2025-01-30'
                }
            ];
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockExpenses)
            });
        });

        await page.goto(`file://${EXPENSE_HTML_PATH}`);
        // Wait for the page to load and JavaScript to execute
        await page.waitForTimeout(100);
    });

    test('should load the expense tracker page successfully', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle('Expense Tracker');

        // Check main heading
        const heading = page.locator('h1');
        await expect(heading).toHaveText('Expense Tracker');

        // Check that main elements are present
        await expect(page.locator('#month-filter')).toBeVisible();
        await expect(page.locator('#category-filter')).toBeVisible();
        await expect(page.locator('#clear-filters')).toBeVisible();
        await expect(page.locator('#expenses-table')).toBeVisible();
    });

    test('should display expenses table with correct data', async ({ page }) => {
        // Wait for expenses to load
        await page.waitForSelector('#expenses-table tbody tr');

        // Check that table has rows
        const rows = page.locator('#expenses-table tbody tr');
        await expect(rows).toHaveCount(5);

        // Check first row data
        const firstRow = rows.first();
        const cells = firstRow.locator('td');
        await expect(cells.nth(0)).toHaveText('Jan 2, 2025'); // Date
        await expect(cells.nth(1)).toHaveText('Groceries'); // Category
        await expect(cells.nth(2)).toHaveText('Expense #1'); // Description
        await expect(cells.nth(3)).toHaveText('$10.00'); // Amount
    });

    test('should display total amount correctly', async ({ page }) => {
        // Wait for total to be calculated and displayed
        await page.waitForSelector('#total-display');

        const totalDisplay = page.locator('#total-display');
        await expect(totalDisplay).toBeVisible();

        const totalAmount = page.locator('#total-amount');
        await expect(totalAmount).toHaveText('$57.50'); // 10 + 15 + 7.5 + 20 + 5
    });

    test('should filter expenses by month', async ({ page }) => {
        // Wait for initial load
        await page.waitForSelector('#expenses-table tbody tr');

        // Select January 2025
        await page.locator('#month-filter').fill('2025-01');

        // Wait for filtering to complete
        await page.waitForTimeout(100);

        // Check that only January expenses are shown (IDs 1, 2, 5)
        const rows = page.locator('#expenses-table tbody tr');
        await expect(rows).toHaveCount(3);

        // Check total is updated
        const totalAmount = page.locator('#total-amount');
        await expect(totalAmount).toHaveText('$30.00'); // 10 + 15 + 5
    });

    test('should clear filters when clear button is clicked', async ({ page }) => {
        // Wait for initial load
        await page.waitForSelector('#expenses-table tbody tr');

        // Apply filters first
        await page.locator('#month-filter').fill('2025-01');
        await page.locator('#category-filter').selectOption('groceries');
        await page.waitForTimeout(100);

        // Verify filters are applied
        const filteredRows = page.locator('#expenses-table tbody tr');
        await expect(filteredRows).toHaveCount(1);

        // Click clear filters button
        await page.locator('#clear-filters').click();
        await page.waitForTimeout(100);

        // Verify all expenses are shown again
        const allRows = page.locator('#expenses-table tbody tr');
        await expect(allRows).toHaveCount(5);

        // Verify filters are reset
        const monthFilter = page.locator('#month-filter');
        const categoryFilter = page.locator('#category-filter');
        await expect(monthFilter).toHaveValue('');
        await expect(categoryFilter).toHaveValue('');

        // Verify total is back to full amount
        const totalAmount = page.locator('#total-amount');
        await expect(totalAmount).toHaveText('$57.50');
    });
});