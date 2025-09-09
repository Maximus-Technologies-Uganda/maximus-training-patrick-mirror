import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const GOLDEN = path.join(process.cwd(), 'frontend/tests/golden-export.csv');

test('stopwatch export matches golden CSV', async ({ page }) => {
  await page.goto('/stopwatch.html');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#btn-export'),
  ]);

  const tmp = await download.path();
  const content = await fs.promises.readFile(tmp, 'utf-8');
  const golden = await fs.promises.readFile(GOLDEN, 'utf-8');
  expect(content.trim()).toBe(golden.trim());
});


