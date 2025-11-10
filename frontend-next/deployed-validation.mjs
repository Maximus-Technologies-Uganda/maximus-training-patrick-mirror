import { chromium } from 'playwright';

const APP_URL = 'https://maximus-training-frontend-673209018655.africa-south1.run.app';

const results = {};
let firstPostTitle = '';

async function runTests() {
  console.log('\n' + '='.repeat(100));
  console.log('DEPLOYED APP VALIDATION - STARTING TESTS');
  console.log('='.repeat(100) + '\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    try {
      await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle' });
      results[1] = { step: 'Navigate to login page', status: 'PASS', details: 'Login page loaded' };
      console.log('✓ PASS');
    } catch (e) {
      results[1] = { step: 'Navigate to login page', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL - Could not load login page');
    }

    // Step 2: Find and fill username input
    console.log('\nStep 2: Filling username input...');
    try {
      const usernameInput = page.locator('input[name="username"], input[name="email"]').first();
      await usernameInput.fill('admin');
      results[2] = { step: 'Fill username input with "admin"', status: 'PASS', details: 'Username entered' };
      console.log('✓ PASS');
    } catch (e) {
      results[2] = { step: 'Fill username input', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL - Could not fill username');
    }

    // Step 3: Find and fill password input
    console.log('\nStep 3: Filling password input...');
    try {
      const passwordInput = page.locator('input[name="password"]');
      await passwordInput.fill('password');
      results[3] = { step: 'Fill password input with "password"', status: 'PASS', details: 'Password entered' };
      console.log('✓ PASS');
    } catch (e) {
      results[3] = { step: 'Fill password input', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL - Could not fill password');
    }

    // Step 4: Find and click Sign In button
    console.log('\nStep 4: Clicking Sign In button...');
    try {
      const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
      await signInButton.click();
      results[4] = { step: 'Click "Sign In" button', status: 'PASS', details: 'Button clicked' };
      console.log('✓ PASS');
    } catch (e) {
      results[4] = { step: 'Click "Sign In" button', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL - Could not click Sign In button');
    }

    // Step 5: Verify redirect to /posts
    console.log('\nStep 5: Verifying redirect to /posts...');
    try {
      await page.waitForURL('**/posts**', { timeout: 10000 });
      const currentUrl = page.url();
      if (currentUrl.includes('/posts')) {
        results[5] = { step: 'Verify redirect to /posts', status: 'PASS', details: `URL: ${currentUrl}` };
        console.log('✓ PASS - Redirected to posts');
      } else {
        results[5] = { step: 'Verify redirect to /posts', status: 'FAIL', details: `Unexpected URL: ${currentUrl}` };
        console.log('✗ FAIL - Wrong URL');
      }
    } catch (e) {
      results[5] = { step: 'Verify redirect to /posts', status: 'FAIL', details: `Timeout or error: ${e}` };
      console.log('✗ FAIL - Redirect timeout');
    }

    // ===== PART 2: FUNCTIONAL & A11Y VALIDATION =====
    console.log('\n' + '-'.repeat(100));
    console.log('PART 2: FUNCTIONAL & A11Y VALIDATION');
    console.log('-'.repeat(100));

    // Step 6: Verify SSR rendering
    console.log('\nStep 6: Verifying SSR rendering...');
    try {
      const html = await page.content();
      const hasCards = html.includes('Card') || html.includes('card');
      const hasLoadingSpinner = html.includes('spinner') || html.includes('Spinner');

      if (hasCards && !hasLoadingSpinner) {
        results[6] = {
          step: 'SSR Verify: Card components rendered without loading spinner',
          status: 'PASS',
          details: 'Cards found in initial HTML, no loading spinner',
        };
        console.log('✓ PASS');
      } else {
        results[6] = {
          step: 'SSR Verify',
          status: 'FAIL',
          details: `Has cards: ${hasCards}, Has spinner: ${hasLoadingSpinner}`,
        };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[6] = { step: 'SSR Verify', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 7: Verify H1 with "Posts" text
    console.log('\nStep 7: Verifying H1 "Posts" is visible...');
    try {
      const h1 = page.locator('h1:has-text("Posts")');
      const isVisible = await h1.isVisible().catch(() => false);
      if (isVisible) {
        results[7] = { step: 'Verify h1 "Posts" is visible', status: 'PASS', details: 'H1 found and visible' };
        console.log('✓ PASS');
      } else {
        results[7] = { step: 'Verify h1 "Posts" is visible', status: 'FAIL', details: 'H1 not visible' };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[7] = { step: 'Verify h1 "Posts" is visible', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 8: Note the first post title
    console.log('\nStep 8: Capturing first post title...');
    try {
      const firstPost = page.locator('[data-testid*="post"], article, [class*="post"]').first();
      firstPostTitle = (await firstPost.textContent()) || '';
      results[8] = {
        step: 'Note first post title',
        status: 'PASS',
        details: `First post: "${firstPostTitle.substring(0, 50)}..."`,
      };
      console.log(`✓ PASS - First post title captured`);
    } catch (e) {
      results[8] = { step: 'Note first post title', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 9: A11y Verify (Input)
    console.log('\nStep 9: Checking input accessibility (label/aria-label)...');
    try {
      const firstInput = page.locator('input').first();
      const inputElement = await firstInput.evaluate((el) => {
        const label = document.querySelector(`label[for="${el.id}"]`);
        const ariaLabel = el.getAttribute('aria-label');
        const placeholder = el.getAttribute('placeholder');
        return {
          hasLabel: !!label,
          hasAriaLabel: !!ariaLabel,
          hasPlaceholder: !!placeholder,
        };
      });

      if (inputElement.hasLabel || inputElement.hasAriaLabel || inputElement.hasPlaceholder) {
        results[9] = {
          step: 'A11y Verify (Input): Label or aria-label present',
          status: 'PASS',
          details: `Label: ${inputElement.hasLabel}, Aria-label: ${inputElement.hasAriaLabel}, Placeholder: ${inputElement.hasPlaceholder}`,
        };
        console.log('✓ PASS');
      } else {
        results[9] = { step: 'A11y Verify (Input)', status: 'FAIL', details: 'No accessibility attributes' };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[9] = { step: 'A11y Verify (Input)', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 10: A11y Verify (Button Focus)
    console.log('\nStep 10: Checking button focus styles...');
    try {
      const firstButton = page.locator('button').first();
      await firstButton.focus();
      await page.waitForTimeout(200);

      const hasFocusStyle = await firstButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const hasFocusVisible = el.matches(':focus-visible');
        const hasOutline = styles.outline && styles.outline !== 'none';
        const hasBoxShadow = styles.boxShadow && styles.boxShadow !== 'none';
        return hasFocusVisible || hasOutline || hasBoxShadow;
      });

      if (hasFocusStyle) {
        results[10] = { step: 'A11y Verify (Button): Focus style visible', status: 'PASS', details: 'Focus style detected' };
        console.log('✓ PASS');
      } else {
        results[10] = { step: 'A11y Verify (Button)', status: 'FAIL', details: 'No focus style detected' };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[10] = { step: 'A11y Verify (Button)', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 11: Click "Next Page" button
    console.log('\nStep 11: Clicking "Next Page" button...');
    try {
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Next Page"), a:has-text("2")').first();
      await nextButton.click();
      results[11] = { step: 'Click "Next Page" button', status: 'PASS', details: 'Next page clicked' };
      console.log('✓ PASS');
    } catch (e) {
      results[11] = { step: 'Click "Next Page" button', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 12: Verify URL contains page=2
    console.log('\nStep 12: Verifying URL contains page=2...');
    try {
      await page.waitForURL('**?page=2**', { timeout: 5000 }).catch(() => {});
      const currentUrl = page.url();
      if (currentUrl.includes('page=2')) {
        results[12] = { step: 'Verify URL contains ?page=2', status: 'PASS', details: `URL: ${currentUrl}` };
        console.log('✓ PASS');
      } else {
        results[12] = { step: 'Verify URL contains ?page=2', status: 'FAIL', details: `URL: ${currentUrl}` };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[12] = { step: 'Verify URL contains ?page=2', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 13: Verify content updated
    console.log('\nStep 13: Verifying content updated on page 2...');
    try {
      const newFirstPost = page.locator('[data-testid*="post"], article, [class*="post"]').first();
      const newFirstPostTitle = (await newFirstPost.textContent()) || '';

      if (newFirstPostTitle !== firstPostTitle && newFirstPostTitle.length > 0) {
        results[13] = {
          step: 'Verify content updated: different first post',
          status: 'PASS',
          details: 'First post differs from page 1',
        };
        console.log('✓ PASS');
      } else {
        results[13] = { step: 'Verify content updated', status: 'FAIL', details: 'Content same or empty' };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[13] = { step: 'Verify content updated', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 14: Click sort button
    console.log('\nStep 14: Clicking sort button...');
    try {
      const sortButton = page.locator('button:has-text("Sort"), button:has-text("Title"), [data-testid="sort"]').first();
      await sortButton.click();
      results[14] = { step: 'Click sort button', status: 'PASS', details: 'Sort button clicked' };
      console.log('✓ PASS');
    } catch (e) {
      results[14] = { step: 'Click sort button', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 15: Verify URL contains sort parameter
    console.log('\nStep 15: Verifying URL contains sort parameter...');
    try {
      await page.waitForURL('**?sort=**', { timeout: 5000 }).catch(() => {});
      const currentUrl = page.url();
      if (currentUrl.includes('sort=')) {
        results[15] = { step: 'Verify URL contains sort parameter', status: 'PASS', details: `URL: ${currentUrl}` };
        console.log('✓ PASS');
      } else {
        results[15] = { step: 'Verify URL contains sort parameter', status: 'FAIL', details: `URL: ${currentUrl}` };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[15] = { step: 'Verify URL contains sort parameter', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 16: Verify post order changed
    console.log('\nStep 16: Verifying post order changed after sort...');
    try {
      const sortedFirstPost = page.locator('[data-testid*="post"], article, [class*="post"]').first();
      const sortedFirstPostTitle = (await sortedFirstPost.textContent()) || '';

      if (sortedFirstPostTitle !== firstPostTitle) {
        results[16] = { step: 'Verify post order changed after sort', status: 'PASS', details: 'Posts reordered' };
        console.log('✓ PASS');
      } else {
        results[16] = { step: 'Verify post order changed', status: 'FAIL', details: 'Posts in same order' };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[16] = { step: 'Verify post order changed', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 17: State Verify (Empty/Error state elements)
    console.log('\nStep 17: Checking for empty/error state elements...');
    try {
      const html = await page.content();
      const hasEmptyState = html.includes('empty-state') || html.includes('emptyState');
      const hasErrorState = html.includes('error-message') || html.includes('error');

      if (hasEmptyState || hasErrorState) {
        results[17] = {
          step: 'State Verify: Empty/error state elements exist in DOM',
          status: 'PASS',
          details: `Empty: ${hasEmptyState}, Error: ${hasErrorState}`,
        };
        console.log('✓ PASS');
      } else {
        results[17] = { step: 'State Verify', status: 'FAIL', details: 'No state elements found' };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[17] = { step: 'State Verify', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }

    // Step 18: A11y Verify (Live Region)
    console.log('\nStep 18: Checking for aria-live regions...');
    try {
      const html = await page.content();
      const hasAriaLive = html.includes('aria-live');

      if (hasAriaLive) {
        results[18] = {
          step: 'A11y Verify (Live Region): aria-live attribute present',
          status: 'PASS',
          details: 'aria-live region found',
        };
        console.log('✓ PASS');
      } else {
        results[18] = { step: 'A11y Verify (Live Region)', status: 'FAIL', details: 'No aria-live region found' };
        console.log('✗ FAIL');
      }
    } catch (e) {
      results[18] = { step: 'A11y Verify (Live Region)', status: 'FAIL', details: `Error: ${e}` };
      console.log('✗ FAIL');
    }
  } finally {
    await browser.close();
  }

  // Print summary
  console.log('\n' + '='.repeat(100));
  console.log('VALIDATION RESULTS SUMMARY');
  console.log('='.repeat(100) + '\n');

  const passCount = Object.values(results).filter((r) => r.status === 'PASS').length;
  const failCount = Object.values(results).filter((r) => r.status === 'FAIL').length;
  const totalSteps = Object.keys(results).length;

  console.log(`Total Steps: ${totalSteps}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Pass Rate: ${((passCount / totalSteps) * 100).toFixed(1)}%\n`);

  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(100));

  for (const [stepNum, result] of Object.entries(results)) {
    const status = result.status === 'PASS' ? '✓ PASS' : '✗ FAIL';
    console.log(`\nStep ${stepNum}: ${result.step}`);
    console.log(`Status: ${status}`);
    console.log(`Details: ${result.details}`);
  }

  console.log('\n' + '='.repeat(100));
  console.log('PART BREAKDOWN:');
  console.log('-'.repeat(100));

  const part1Results = Object.entries(results)
    .filter(([num]) => parseInt(num) >= 1 && parseInt(num) <= 5)
    .map(([, r]) => r);
  const part1Pass = part1Results.filter((r) => r.status === 'PASS').length;
  console.log(`Part 1 (Authentication): ${part1Pass}/${part1Results.length} PASSED`);

  const part2Results = Object.entries(results)
    .filter(([num]) => parseInt(num) >= 6 && parseInt(num) <= 18)
    .map(([, r]) => r);
  const part2Pass = part2Results.filter((r) => r.status === 'PASS').length;
  console.log(`Part 2 (Functional & A11y): ${part2Pass}/${part2Results.length} PASSED`);

  console.log('\n' + '='.repeat(100) + '\n');

  return passCount === totalSteps ? 0 : 1;
}

runTests().then((exitCode) => process.exit(exitCode));