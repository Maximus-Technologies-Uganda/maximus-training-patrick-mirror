import { test, expect } from '@playwright/test';

test('performance smoke: add 1000 items and filter under 500ms', async ({ page }) => {
  await page.goto('/todo.html');

  // Add 1000 items using evaluate to batch DOM updates
  const elapsedAdd = await page.evaluate(async () => {
    const start = performance.now();
    const form = document.querySelector('#add-task-form');
    const title = document.querySelector('#task-title');
    for (let i = 0; i < 1000; i++) {
      title.value = 'Item ' + i;
      form.dispatchEvent(new Event('submit'));
    }
    return performance.now() - start;
  });

  // Apply a filter and measure time
  const elapsedFilter = await page.evaluate(() => {
    const start = performance.now();
    const search = document.querySelector('#search-text');
    search.value = 'Item 99';
    search.dispatchEvent(new Event('input'));
    return performance.now() - start;
  });

  // Basic sanity: ensure at least one item visible
  const visibleCount = await page.locator('li.task-item:not(.hidden)').count();
  expect(visibleCount).toBeGreaterThan(0);

  expect(elapsedFilter).toBeLessThan(500);
});


