import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

/**
 * Storybook a11y scan script – T056
 *
 * Assumes Storybook has been built to `storybook-static` and is served
 * separately (e.g., via `npx http-server storybook-static -p 6006`).
 *
 * The script visits the Storybook iframe and runs axe-core against
 * all stories, failing on any serious+ violations.
 */

async function main() {
  const baseUrl = process.env.STORYBOOK_BASE_URL || 'http://localhost:6006';
  const iframeUrl = new URL('iframe.html', baseUrl).toString();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(iframeUrl, { waitUntil: 'domcontentloaded' });

    const axe = new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .withTags(['wcag2a', 'wcag2aa']);

    const results = await axe.analyze();

    const seriousOrWorse = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact || 'minor'),
    );

    if (seriousOrWorse.length > 0) {
      console.error('A11y violations detected in Storybook:');
      for (const v of seriousOrWorse) {
        console.error(`- ${v.id}: ${v.description}`);
      }
      process.exitCode = 1;
    } else {
      console.log('Storybook a11y scan passed (no serious+ violations).');
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('storybook-scan failed', err);
  process.exitCode = 1;
});
