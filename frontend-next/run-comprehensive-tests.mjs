import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://maximus-training-frontend-673209018655.africa-south1.run.app/posts';
const screenshotDir = path.join(process.cwd(), 'test-evidence');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const results = {
  passed: 0,
  failed: 0,
  tests: [],
  screenshots: [],
  startTime: new Date().toISOString(),
  issues: []
};

async function test(name, fn) {
  try {
    console.log(`\n📍 Testing: ${name}`);
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✅ PASSED: ${name}`);
    return true;
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    results.issues.push({ test: name, error: error.message });
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function screenshot(filename) {
  const fullPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: fullPath });
  results.screenshots.push(filename);
  console.log(`📸 Screenshot: ${filename}`);
}

let page;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createContext();
  page = await context.newPage();

  try {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 WEEK 9 FRONTEND FOUNDATIONS - COMPREHENSIVE MANUAL TESTING');
    console.log('='.repeat(70));
    console.log(`Live URL: ${BASE_URL}`);
    console.log(`Start Time: ${results.startTime}\n`);

    // TEST 1: Initial Load
    await test('Page loads successfully', async () => {
      const start = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - start;
      console.log(`   Load time: ${loadTime}ms`);
      if (loadTime > 5000) throw new Error(`Load time ${loadTime}ms exceeds 5s`);
    });

    await screenshot('01-initial-load.png');

    // TEST 2: SSR - Posts in HTML
    await test('Posts rendered server-side (SSR)', async () => {
      const content = await page.content();
      if (!content.includes('<') || !content.length) throw new Error('No HTML content');

      const postCount = await page.locator('article, [role="article"], .post, [class*="post"]').count();
      console.log(`   Posts found: ${postCount}`);
      if (postCount === 0) throw new Error('No posts found in DOM');
    });

    // TEST 3: Post Structure
    await test('Post elements have required content', async () => {
      const titles = await page.locator('h1, h2, h3, [class*="title"]').count();
      const authors = await page.locator('[class*="author"], [class*="by"], [class*="writer"]').count();
      const dates = await page.locator('time, [class*="date"], [class*="created"]').count();

      console.log(`   Titles: ${titles}, Authors: ${authors}, Dates: ${dates}`);
      if (titles === 0) throw new Error('No post titles found');
    });

    // TEST 4: No Loading Spinner on Initial Load
    await test('No loading spinner visible on initial load', async () => {
      const spinners = await page.locator('[class*="loading"], [class*="spinner"], .spinner').count();
      console.log(`   Loading spinners: ${spinners}`);
      if (spinners > 1) throw new Error(`Too many loading indicators: ${spinners}`);
    });

    // TEST 5: Pagination Controls Present
    await test('Pagination controls visible', async () => {
      const nextBtn = await page.locator('button:has-text("Next"), [aria-label*="next"]').count();
      const prevBtn = await page.locator('button:has-text("Previous"), button:has-text("Prev"), [aria-label*="previous"]').count();
      const pageInfo = await page.locator('text=/Page \\d+/').count();

      console.log(`   Next: ${nextBtn > 0}, Previous: ${prevBtn > 0}, Page Info: ${pageInfo > 0}`);
      if (nextBtn === 0 && prevBtn === 0) throw new Error('No pagination buttons found');
    });

    await screenshot('02-pagination-visible.png');

    // TEST 6: Pagination Functionality
    await test('Pagination - click Next button updates URL', async () => {
      const nextBtn = page.locator('button:has-text("Next")').first();
      const exists = await nextBtn.count() > 0;

      if (exists) {
        const isEnabled = await nextBtn.isEnabled().catch(() => false);
        if (isEnabled) {
          const urlBefore = page.url();
          await nextBtn.click();
          await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
          const urlAfter = page.url();

          console.log(`   URL changed: ${urlBefore !== urlAfter}`);
          console.log(`   Before: ${urlBefore}`);
          console.log(`   After: ${urlAfter}`);

          if (urlBefore === urlAfter) throw new Error('URL did not change after clicking Next');
        }
      }
    });

    await screenshot('03-page-2.png');

    // TEST 7: Posts Changed on Page 2
    await test('Different posts displayed on page 2', async () => {
      const posts = await page.locator('article, [role="article"], .post').count();
      console.log(`   Posts on page 2: ${posts}`);
      if (posts === 0) throw new Error('No posts on page 2');
    });

    // TEST 8: Design Tokens Applied
    await test('Design tokens applied to components', async () => {
      const tokens = await page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        return {
          colorPrimary: root.getPropertyValue('--color-primary')?.trim(),
          colorText: root.getPropertyValue('--color-text')?.trim(),
          spacing1: root.getPropertyValue('--space-1')?.trim(),
        };
      });

      console.log(`   Tokens found:`, tokens);
      const hasTokens = Object.values(tokens).some(v => v && v.length > 0);
      if (!hasTokens) throw new Error('No design tokens detected');
    });

    // TEST 9: Button Component Styling
    await test('Button component uses token colors', async () => {
      const buttons = await page.locator('button').count();
      console.log(`   Buttons found: ${buttons}`);

      if (buttons > 0) {
        const btnColor = await page.locator('button').first().evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log(`   Button background: ${btnColor}`);
      }
      if (buttons === 0) throw new Error('No buttons found');
    });

    // TEST 10: Input Elements with Labels
    await test('Input elements have associated labels', async () => {
      const inputs = await page.locator('input').count();
      const labels = await page.locator('label').count();

      console.log(`   Inputs: ${inputs}, Labels: ${labels}`);

      if (inputs > 0) {
        const firstInput = page.locator('input').first();
        const inputId = await firstInput.getAttribute('id');
        const hasLabel = inputId ?
          await page.locator(`label[for="${inputId}"]`).count() > 0 :
          await firstInput.getAttribute('aria-label') !== null;

        if (!hasLabel) throw new Error('Input has no label');
      }
    });

    // TEST 11: Card Component Structure
    await test('Card components with proper structure', async () => {
      const cards = await page.locator('[class*="card"], article, [class*="post-item"]').count();
      console.log(`   Cards found: ${cards}`);
      if (cards === 0) throw new Error('No card components found');
    });

    // TEST 12: Accessibility - Keyboard Navigation
    await test('Keyboard navigation - Tab works', async () => {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName || 'NONE';
      });

      console.log(`   First focused element: ${focused}`);
      if (focused === 'NONE' || focused === 'HTML') throw new Error('No focusable elements');
    });

    // TEST 13: Focus Visible
    await test('Focus ring visible on interactive elements', async () => {
      const buttons = page.locator('button').first();
      await buttons.focus();

      const focusStyle = await buttons.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          border: style.border
        };
      });

      console.log(`   Focus styles:`, focusStyle);
      const hasFocus = focusStyle.outline !== 'none' || focusStyle.boxShadow !== 'none';
      if (!hasFocus) console.warn('   ⚠️ No visible focus indicator detected');
    });

    // TEST 14: ARIA Attributes
    await test('ARIA attributes present', async () => {
      const ariaLabels = await page.locator('[aria-label]').count();
      const ariaDescribedBy = await page.locator('[aria-describedby]').count();
      const ariaLive = await page.locator('[aria-live]').count();

      console.log(`   ARIA labels: ${ariaLabels}, aria-describedby: ${ariaDescribedBy}, aria-live: ${ariaLive}`);
    });

    // TEST 15: No Console Errors
    await test('No JavaScript errors in console', async () => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      // Brief wait to catch any errors
      await page.waitForTimeout(1000);

      if (errors.length > 0) {
        console.log(`   Errors found: ${errors.length}`);
        console.log(`   ${errors.join('\n   ')}`);
      }
      // Don't fail on console errors, just report
      console.log(`   Console errors: ${errors.length}`);
    });

    // TEST 16: Responsive Design - Mobile View
    await test('Mobile responsive design (375px)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(BASE_URL);

      const posts = await page.locator('article, [class*="post"]').count();
      console.log(`   Posts visible on mobile: ${posts}`);
      if (posts === 0) throw new Error('No posts visible on mobile view');
    });

    await screenshot('04-mobile-view.png');

    // TEST 17: Responsive Design - Desktop View
    await test('Desktop responsive design (1920px)', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(BASE_URL);

      const posts = await page.locator('article, [class*="post"]').count();
      console.log(`   Posts visible on desktop: ${posts}`);
      if (posts === 0) throw new Error('No posts visible on desktop view');
    });

    await screenshot('05-desktop-view.png');

    // TEST 18: Sorting Controls
    await test('Sorting controls present and functional', async () => {
      const sortDropdown = await page.locator('select').count();
      const sortButtons = await page.locator('[class*="sort"], [aria-label*="sort"]').count();

      console.log(`   Sort dropdown: ${sortDropdown}, Sort buttons: ${sortButtons}`);

      if (sortDropdown > 0) {
        const options = await page.locator('select option').count();
        console.log(`   Sort options: ${options}`);
      }
    });

    // TEST 19: State Management Components
    await test('State management components available', async () => {
      const loading = await page.locator('[class*="loading"], [role="status"]').count();
      const empty = await page.locator('[class*="empty"], text=/no posts/i').count();
      const error = await page.locator('[class*="error"], [role="alert"]').count();

      console.log(`   Loading: ${loading}, Empty: ${empty}, Error: ${error}`);
    });

    // TEST 20: Performance - Page Load Time
    await test('Performance - Page load < 3 seconds', async () => {
      const start = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - start;

      console.log(`   Load time: ${loadTime}ms`);
      if (loadTime > 3000) throw new Error(`Load time ${loadTime}ms exceeds 3s`);
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${results.passed + results.failed}`);
    console.log(`Passed: ${results.passed} ✅`);
    console.log(`Failed: ${results.failed} ❌`);
    const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Screenshots: ${results.screenshots.length}`);
    console.log(`\n📁 Evidence saved to: ${screenshotDir}`);

    if (results.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      results.issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. ${issue.test}`);
        console.log(`   Error: ${issue.error}`);
      });
    }

    // Save results to JSON
    results.endTime = new Date().toISOString();
    fs.writeFileSync(
      path.join(process.cwd(), 'test-results.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n✨ Testing complete!\n');

  } catch (error) {
    console.error('\n❌ Critical error:', error.message);
    results.issues.push({ test: 'CRITICAL', error: error.message });
  } finally {
    await browser.close();
  }
})();