import { test, expect } from '@playwright/test';

// Use fake timers by overriding Date in the page context for determinism

test.describe('Stopwatch - timer stability and reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      let now = 0;
      const OriginalDate = Date;
      class FakeDate extends OriginalDate {
        constructor(...args) { super(...(args.length ? args : [new OriginalDate(now)])); }
        static now() { return now; }
      }
      // @ts-ignore
      window.__advanceMs = (ms) => { now += ms; };
      // @ts-ignore
      window.Date = FakeDate;
    });
    await page.goto('/stopwatch.html');
  });

  test('reset clears time and shows 00:00.000', async ({ page }) => {
    await page.click('#btn-toggle'); // start at t=0
    await page.evaluate(() => window.__advanceMs(1234));
    await page.click('#btn-toggle'); // stop at t=1234
    await expect(page.locator('#timer-display')).toHaveText('00:01.234');

    await page.click('#btn-reset');
    await expect(page.locator('#timer-display')).toHaveText('00:00.000');
  });
});


