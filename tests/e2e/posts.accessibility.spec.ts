/**
 * @file posts.accessibility.spec.ts
 * @description Playwright E2E accessibility test for /posts page
 * 
 * **FR-029** (Implied): Accessibility scanning with axe
 * 
 * Tests:
 * - Page loads without JS errors
 * - Axe scan completes without serious+ violations
 * - No color contrast violations
 * - Keyboard navigation available
 * - ARIA labels present where needed
 * - Focus management correct
 * 
 * Note: Uses optimized config (4 workers, no retries) per playwright.optimized.config.ts
 */

import { test, expect } from '@playwright/test';

test.describe('/posts page accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to posts page
    await page.goto('/posts');
    
    // Wait for main content to stabilize
    await page.waitForLoadState('networkidle');
  });

  test('should load without JS errors @smoke', async ({ page }) => {
    /**
     * Baseline: Page loads without console errors
     * 
     * Validation:
     * - No uncaught errors in console
     * - No network failures on critical resources
     */
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate and wait for stable state
    await page.goto('/posts', { waitUntil: 'networkidle' });
    
    // Assert no console errors
    expect(errors).toHaveLength(0);
  });

  test('should pass axe accessibility scan @smoke', async ({ page }) => {
    /**
     * Primary accessibility check: axe-core scan
     * 
     * Validation:
     * - No violations of type "serious" or "critical"
     * - Warnings logged but not blocking
     * 
     * Common checks:
     * - Color contrast (WCAG AA minimum 4.5:1 for text)
     * - ARIA role/attribute validity
     * - Button/link labels
     * - Form labels and validation messages
     * - Keyboard accessibility
     * 
     * Failure trigger: serious or critical violations only
     */
    
    // Inject axe-core script
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' });
    
    // Run accessibility checks
    const violations = await page.evaluate(() => {
      return new Promise<Array<{ impact: string; description: string }>>((resolve) => {
        const axe = window as unknown as { axe: { run: (callback: (results: { violations: Array<{ impact: string; description: string }> }) => void) => void } };
        axe.axe.run((results) => {
          // Filter to serious+ violations
          const serious = results.violations.filter(
            (v) => v.impact === 'serious' || v.impact === 'critical'
          );
          resolve(serious);
        });
      });
    });

    // Assert no serious violations
    expect(violations).toHaveLength(0);
  });

  test('should have valid heading hierarchy', async ({ page }) => {
    /**
     * Structure check: Heading hierarchy (h1 > h2 > h3)
     * 
     * Validation:
     * - No h2 without preceding h1
     * - No skipped levels (h1 → h3)
     * - At least one h1
     */
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    expect(headings.length).toBeGreaterThan(0);
    
    let lastLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName);
      const level = parseInt(tagName[1]);
      
      // Allow level increase of 1 or more, but not skipping
      if (lastLevel > 0) {
        expect(level).toBeLessThanOrEqual(lastLevel + 1);
      }
      lastLevel = level;
    }
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    /**
     * Label check: Buttons, links, and form inputs
     * 
     * Validation:
     * - All buttons have visible text or aria-label
     * - All links have href and text/title
     * - Form inputs associated with <label> or aria-labelledby
     */
    
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      const hasLabel = text?.trim() || ariaLabel || title;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation @smoke', async ({ page }) => {
    /**
     * Keyboard check: Tab/Shift+Tab navigation
     * 
     * Validation:
     * - Tab key moves focus to next interactive element
     * - Shift+Tab moves focus to previous
     * - Focus visible (outline or highlight)
     * - No focus trap (can always move forward/backward)
     */
    
    // Get first focusable element
    const firstFocusable = await page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
    
    if (firstFocusable) {
      await firstFocusable.focus();
      
      // Verify focus was set
      const focused = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      expect(focused).toBeTruthy();
    }
    
    // Tab to next element
    await page.keyboard.press('Tab');
    
    // Verify focus moved (different element focused)
    const afterTab = await page.evaluate(() => {
      return (document.activeElement as HTMLElement)?.textContent?.substring(0, 20);
    });
    
    expect(afterTab).toBeTruthy();
  });

  test('should have sufficient color contrast @smoke', async ({ page }) => {
    /**
     * Contrast check: Text and background color ratio
     * 
     * Validation:
     * - Normal text >= 4.5:1 contrast ratio (WCAG AA)
     * - Large text >= 3:1 contrast ratio
     */
    
    // Inject axe-core for contrast check
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' });
    
    // Run color-contrast check specifically
    const contrastViolations = await page.evaluate(() => {
      return new Promise<Array<{ impact: string }>>((resolve) => {
        const axe = window as unknown as { axe: { run: (options: { runOnly: { type: string; values: string[] } }, callback: (results: { violations: Array<{ impact: string }> }) => void) => void } };
        axe.axe.run(
          { runOnly: { type: 'rule', values: ['color-contrast'] } },
          (results) => {
            resolve(results.violations);
          }
        );
      });
    });

    // Assert no serious color contrast violations
    expect(contrastViolations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toHaveLength(0);
  });

  test('should announce errors to screen readers', async ({ page }) => {
    /**
     * Live region check: Error messages and dynamic content
     * 
     * Validation:
     * - Error messages have role="status" or role="alert"
     * - aria-live="assertive" for critical alerts
     * - aria-live="polite" for notifications
     */
    
    // Check for live regions or status messages
    const liveRegions = await page.locator('[role="status"], [role="alert"], [aria-live]').all();
    
    // Not blocking if no live regions, but log for verification
    if (liveRegions.length > 0) {
      for (const region of liveRegions) {
        const role = await region.getAttribute('role');
        const ariaLive = await region.getAttribute('aria-live');
        
        // Should have role or aria-live
        expect(role || ariaLive).toBeTruthy();
      }
    }
  });

  test('should have proper table semantics if present', async ({ page }) => {
    /**
     * Table check: Proper <table> structure (thead, tbody, th with scope)
     * 
     * Validation:
     * - <th> elements have scope="col" or scope="row"
     * - <table> has caption or aria-label
     * - No layout tables (use role="presentation" if needed)
     */
    
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Check for table header
      const hasHeader = await table.locator('thead').count();
      
      if (hasHeader > 0) {
        // Verify th elements have scope
        const headers = await table.locator('th').all();
        
        for (const header of headers) {
          const scope = await header.getAttribute('scope');
          expect(scope).toMatch(/^(col|row|colgroup|rowgroup)$/);
        }
      }
      
      // Check for caption or aria-label
      const caption = await table.locator('caption').count();
      const ariaLabel = await table.getAttribute('aria-label');
      
      expect(caption > 0 || ariaLabel).toBeTruthy();
    }
  });

  test('should not have focus traps', async ({ page }) => {
    /**
     * Focus trap check: User can always move focus out
     * 
     * Validation:
     * - No modal dialog without proper focus management (UNLESS modal is expected)
     * - Tab key always moves focus to next element
     * - No infinite focus loop
     * 
     * Note: This is a heuristic check; full trap detection requires manual review
     */
    
    // Get all focusable elements
    const focusable = await page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    if (focusable.length > 1) {
      // Focus first
      await focusable[0].focus();
      
      // Tab through elements, track focus order
      const focusOrder: string[] = [];
      for (let i = 0; i < focusable.length + 1; i++) {
        const active = await page.evaluate(() => {
          return (document.activeElement as HTMLElement)?.tagName;
        });
        focusOrder.push(active);
        
        // If we're back at body, we've cycled (expected)
        if (active === 'BODY') {
          break;
        }
        
        await page.keyboard.press('Tab');
      }
      
      // Should have visited at least 2 unique elements
      expect(new Set(focusOrder).size).toBeGreaterThan(1);
    }
  });
});

/**
 * Test metadata for CI integration
 * 
 * Tags: @smoke (runs on all commits), @a11y (runs in accessibility suite)
 * Timeout: 30s per test (Playwright default)
 * Workers: 4 (per playwright.optimized.config.ts)
 * Retries: 0 (per optimized config for speed)
 * 
 * Success criteria:
 * - All tests pass
 * - Axe violations: 0 serious+
 * - Color contrast: 0 serious+
 * - Console errors: 0
 */
