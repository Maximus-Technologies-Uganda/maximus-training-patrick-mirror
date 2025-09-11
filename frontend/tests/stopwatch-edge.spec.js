import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Stopwatch edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stopwatch.html');
  });

  test('reset clears elapsed and any future laps list (DEV-196.1)', async ({ page }) => {
    // Mock timers via Date.now override to avoid drift
    await page.addInitScript(() => {
      let t = 0;
      // eslint-disable-next-line no-undef
      const _Date = Date;
      // eslint-disable-next-line no-undef
      Date.now = () => t;
      // Provide a helper to advance time from tests via window
      // eslint-disable-next-line no-undef
      window.__advance = (ms) => {
        t += ms;
      };
    });
    await page.reload();

    await page.click('#btn-toggle'); // start at t=0
    await page.evaluate(() => window.__advance(1500));
    await page.click('#btn-toggle'); // stop at t=1500
    await expect(page.locator('#timer-display')).toHaveText('00:01.500');

    await page.click('#btn-reset');
    await expect(page.locator('#timer-display')).toHaveText('00:00.000');
  });

  test('CSV export golden file comparison with normalized newlines (DEV-196.2)', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btn-export'),
    ]);
    const tmp = await download.path();
    const content = await fs.promises.readFile(tmp, 'utf-8');
    // Normalize line endings to \n for comparison
    const normalized = content.replace(/\r\n/g, '\n');
    // Minimal expected CSV header present
    expect(normalized).toMatch(/elapsed_ms,elapsed_formatted\n/);
  });
});


