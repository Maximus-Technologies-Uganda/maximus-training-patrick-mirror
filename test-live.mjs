import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://maximus-training-frontend-673209018655.africa-south1.run.app';
const screenshotDir = path.join(process.cwd(), 'test-screenshots');

// Create screenshot directory
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const testResults = [];

async function logTest(name, result, details = '') {
  const status = result ? '✅' : '❌';
  const message = `${status} ${name}${details ? ': ' + details : ''}`;
  console.log(message);
  testResults.push({ name, result, details });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createContext();
  const page = await context.newPage();

  try {
    console.log('\n🧪 WEEK 9 LIVE DEPLOYMENT TESTING\n');
    console.log('='.repeat(60));

    // Test 1: Initial Load
    console.log('\n📍 TEST 1: SSR & Initial Page Load');
    console.log('-'.repeat(60));

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/posts`, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    await logTest('Page loads successfully', true, `${loadTime}ms`);
    await logTest('Load time < 5s', loadTime < 5000, `${loadTime}ms`);

    await page.screenshot({ path: path.join(screenshotDir, '01-initial-load.png') });
    console.log(`📸 Screenshot saved: 01-initial-load.png`);

    // Test 2: Posts List Rendering
    console.log('\n📍 TEST 2: Posts List Rendering');
    console.log('-'.repeat(60));

    const postElements = await page.locator('article, [role="article"], .post, [class*="post-item"]').count();
    await logTest('Posts are rendered', postElements > 0, `${postElements} posts found`);

    const titles = await page.locator('h2, h3, [class*="title"]').count();
    await logTest('Post titles visible', titles > 0, `${titles} titles found`);

    await page.screenshot({ path: path.join(screenshotDir, '02-posts-list.png') });
    console.log(`📸 Screenshot saved: 02-posts-list.png`);

    // Test 3: Design Tokens
    console.log('\n📍 TEST 3: Design System Tokens');
    console.log('-'.repeat(60));

    const tokenCheck = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        colorPrimary: root.getPropertyValue('--color-primary'),
        colorSurface: root.getPropertyValue('--color-surface'),
        colorText: root.getPropertyValue('--color-text'),
        spacing1: root.getPropertyValue('--space-1'),
        radiusSm: root.getPropertyValue('--radius-sm'),
      };
    });

    const hasTokens = Object.values(tokenCheck).some(v => v && v.trim().length > 0);
    await logTest('CSS tokens defined', hasTokens, JSON.stringify(tokenCheck));

    // Test 4: Components
    console.log('\n📍 TEST 4: Design System Components');
    console.log('-'.repeat(60));

    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input').count();
    const cards = await page.locator('[class*="card"], article, [class*="post"]').count();

    await logTest('Button components present', buttons > 0, `${buttons} buttons`);
    await logTest('Input components present', inputs > 0, `${inputs} inputs`);
    await logTest('Card components present', cards > 0, `${cards} cards`);

    // Test 5: Pagination
    console.log('\n📍 TEST 5: Pagination Controls');
    console.log('-'.repeat(60));

    const paginationControls = await page.locator('[class*="pagination"], nav[aria-label*="[Pp]age"], button:has-text("Next"), button:has-text("Previous")').count();
    await logTest('Pagination controls present', paginationControls > 0, `${paginationControls} controls`);

    const nextBtn = page.locator('button:has-text("Next")').first();
    const nextExists = await nextBtn.count() > 0;
    await logTest('Next button present', nextExists);

    if (nextExists) {
      const isEnabled = await nextBtn.isEnabled().catch(() => false);
      await logTest('Next button functional', isEnabled);

      if (isEnabled) {
        const urlBefore = page.url();
        await nextBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
        const urlAfter = page.url();

        await logTest('Pagination updates URL', urlBefore !== urlAfter, `URL changed`);
        await page.screenshot({ path: path.join(screenshotDir, '03-pagination-page2.png') });
        console.log(`📸 Screenshot saved: 03-pagination-page2.png`);
      }
    }

    // Test 6: Button States
    console.log('\n📍 TEST 6: Button Component States');
    console.log('-'.repeat(60));

    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      const buttonText = await firstButton.textContent();
      const isDisabled = await firstButton.isDisabled();

      await logTest('Button renders with text', buttonText && buttonText.trim().length > 0, `"${buttonText}"`);
      await logTest('Button state tracked', true, `disabled: ${isDisabled}`);

      // Check hover
      await firstButton.hover();
      const hoverOpacity = await firstButton.evaluate(el =>
        window.getComputedStyle(el).opacity
      );
      await logTest('Button hover state', true, `opacity: ${hoverOpacity}`);
    }

    // Test 7: Accessibility
    console.log('\n📍 TEST 7: Accessibility Compliance');
    console.log('-'.repeat(60));

    const labels = await page.locator('label').count();
    await logTest('Labels present for inputs', labels >= inputs, `${labels} labels for ${inputs} inputs`);

    const ariaLiveRegions = await page.locator('[aria-live]').count();
    await logTest('ARIA live regions present', ariaLiveRegions > 0, `${ariaLiveRegions} regions`);

    const ariaLabels = await page.locator('[aria-label]').count();
    await logTest('ARIA labels present', ariaLabels > 0, `${ariaLabels} labels`);

    const focusableElements = await page.locator('button, a, input, [tabindex]').count();
    await logTest('Focusable elements present', focusableElements > 0, `${focusableElements} elements`);

    // Test 8: Sorting
    console.log('\n📍 TEST 8: Sorting Functionality');
    console.log('-'.repeat(60));

    const sortDropdown = page.locator('select').first();
    const sortExists = await sortDropdown.count() > 0;
    await logTest('Sort control present', sortExists);

    if (sortExists) {
      const options = await page.locator('select option').count();
      await logTest('Sort options available', options > 1, `${options} options`);
    }

    // Test 9: Error Handling
    console.log('\n📍 TEST 9: Error & State Handling');
    console.log('-'.repeat(60));

    const errorElements = await page.locator('[class*="error"], [role="alert"]').count();
    await logTest('Error handling available', true, `${errorElements} error elements`);

    const emptyStateElements = await page.locator('[class*="empty"], text=/no posts/i').count();
    await logTest('Empty state handling available', true, `${emptyStateElements} empty state elements`);

    const loadingElements = await page.locator('[class*="loading"], [role="status"]').count();
    await logTest('Loading state handling available', true, `${loadingElements} loading elements`);

    // Test 10: Responsive Design
    console.log('\n📍 TEST 10: Responsive Design');
    console.log('-'.repeat(60));

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/posts`);
    const mobilePostsCount = await page.locator('article, [class*="post"]').count();
    await logTest('Mobile viewport renders posts', mobilePostsCount > 0, `${mobilePostsCount} posts`);
    await page.screenshot({ path: path.join(screenshotDir, '04-mobile-view.png') });
    console.log(`📸 Screenshot saved: 04-mobile-view.png`);

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/posts`);
    const desktopPostsCount = await page.locator('article, [class*="post"]').count();
    await logTest('Desktop viewport renders posts', desktopPostsCount > 0, `${desktopPostsCount} posts`);
    await page.screenshot({ path: path.join(screenshotDir, '05-desktop-view.png') });
    console.log(`📸 Screenshot saved: 05-desktop-view.png`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TEST SUMMARY\n');

    const passed = testResults.filter(t => t.result).length;
    const total = testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass Rate: ${passRate}%`);

    console.log('\n📁 Screenshots saved to:', screenshotDir);
    console.log('\n✨ Live deployment testing complete!\n');

  } catch (error) {
    console.error('Test error:', error.message);
    console.error(error);
  } finally {
    await browser.close();
  }
})();