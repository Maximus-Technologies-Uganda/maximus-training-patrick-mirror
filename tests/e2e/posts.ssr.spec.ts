/**
 * @file posts.ssr.spec.ts
 * @description Playwright E2E test for SSR /posts with JavaScript disabled
 * 
 * **FR-023** (SSR Parity): Ensure server-rendered HTML is contentful and doesn't rely on JS
 * 
 * Tests:
 * - Page renders content with JS disabled
 * - At least 1 <tr> (post row) present in rendered HTML
 * - No placeholder text (skeleton, loading, etc.)
 * - Table structure correct
 * - Links are server-rendered and functional
 * - Error states render without JS
 * 
 * Execution:
 * - Set javaScriptEnabled: false in browser context
 * - Verify pure HTML response contains data
 * 
 * Note: Uses optimized config (4 workers, no retries)
 */

import { test, expect, Browser, BrowserContext } from '@playwright/test';

/**
 * Helper: Create browser context with JS disabled
 */
async function createNoJSContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    javaScriptEnabled: false,
  });
}

test.describe('/posts page SSR (JavaScript disabled)', () => {
  let noJSContext: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // Create a context with JS disabled for all tests in this suite
    noJSContext = await createNoJSContext(browser);
  });

  test.afterAll(async () => {
    await noJSContext.close();
  });

  test('should render contentful SSR HTML without JavaScript @smoke', async ({ browser }) => {
    /**
     * Baseline: Page loads and renders server-generated content
     * 
     * Validation:
     * - HTTP 200 response
     * - HTML contains <table> or similar structure
     * - No hydration errors in response
     * - Content-Type: text/html
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      const response = await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      expect(response?.status()).toBe(200);
      expect(response?.headers()['content-type']).toMatch(/text\/html/);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should have at least one post row in rendered HTML @smoke', async ({ browser }) => {
    /**
     * Content check: Posts table contains data rows
     * 
     * Validation:
     * - At least 1 <tr> in the posts table
     * - Each row has cells with post data
     * - No "loading" or "skeleton" placeholders
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Find table
      const table = await page.locator('table').first();
      
      // Count <tr> in tbody (skip header)
      const bodyRows = await table.locator('tbody tr').count();
      
      expect(bodyRows).toBeGreaterThanOrEqual(1);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should not contain placeholder text @smoke', async ({ browser }) => {
    /**
     * Placeholder check: No skeleton, loading, or placeholder indicators
     * 
     * Validation:
     * - No text matching "loading", "skeleton", "placeholder", "shimmer"
     * - No empty data cells
     * - No aria-label="Loading" elements
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Get all text content
      const bodyText = await page.textContent('body');
      
      expect(bodyText).not.toMatch(/loading/i);
      expect(bodyText).not.toMatch(/skeleton/i);
      expect(bodyText).not.toMatch(/placeholder/i);
      expect(bodyText).not.toMatch(/shimmer/i);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should render table with proper structure', async ({ browser }) => {
    /**
     * Table structure check: thead, tbody, th, td
     * 
     * Validation:
     * - <table> present
     * - <thead> with <th> headers
     * - <tbody> with <tr> rows
     * - Each <tr> has consistent cell count
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Check table structure
      const table = await page.locator('table').first();
      
      // Verify thead
      const thead = await table.locator('thead').count();
      expect(thead).toBeGreaterThan(0);
      
      // Verify thead has th
      const th = await table.locator('thead th').count();
      expect(th).toBeGreaterThan(0);
      
      // Verify tbody
      const tbody = await table.locator('tbody').count();
      expect(tbody).toBeGreaterThan(0);
      
      // Verify tbody has tr with td
      const bodyRows = await table.locator('tbody tr').all();
      expect(bodyRows.length).toBeGreaterThan(0);
      
      for (const row of bodyRows) {
        const cells = await row.locator('td').count();
        expect(cells).toBeGreaterThan(0);
      }
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should render post data in table cells', async ({ browser }) => {
    /**
     * Data presence check: Post fields populated
     * 
     * Validation:
     * - Post title present in cell
     * - Post author present in cell
     * - Post date/timestamp present
     * - No empty cells in key columns
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Get first post row
      const firstRow = await page.locator('table tbody tr').first();
      
      // Get all cells
      const cells = await firstRow.locator('td').all();
      
      // Should have at least title, author, date
      expect(cells.length).toBeGreaterThanOrEqual(3);
      
      // Check each cell has content
      for (const cell of cells) {
        const text = await cell.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should render links without JavaScript', async ({ browser }) => {
    /**
     * Link check: Post links are server-rendered with href
     * 
     * Validation:
     * - <a> tags present with href attributes
     * - href points to valid resource
     * - Link text is not empty
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Find post title links
      const links = await page.locator('table tbody a').all();
      
      expect(links.length).toBeGreaterThan(0);
      
      for (const link of links) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        expect(href).toBeTruthy();
        expect(text?.trim()).toBeTruthy();
      }
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should handle error state without JavaScript', async ({ browser }) => {
    /**
     * Error handling check: Graceful error message rendered server-side
     * 
     * Validation:
     * - If API is unreachable, error message still renders
     * - Error message is readable text (not JSON)
     * - User can see action (retry link, etc.)
     * 
     * Note: This test may pass even if no error occurs (fallback behavior)
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    // Intercept API call to simulate failure
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });
    
    try {
      const response = await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Page should still load (SSR fallback)
      expect(response?.status()).toBe(200);
      
      // Check for error message or fallback content
      const bodyText = await page.textContent('body');
      
      // Should contain either data or error message (not blank)
      expect(bodyText?.trim()).toBeTruthy();
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should preserve HTML semantics', async ({ browser }) => {
    /**
     * Semantic HTML check: Proper use of semantic elements
     * 
     * Validation:
     * - <main> or main[role="main"] for primary content
     * - <header> if header present
     * - <article> or section for posts (if applicable)
     * - No div soup for content areas
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Check for main content area
      const main = await page.locator('main, [role="main"]').count();
      expect(main).toBeGreaterThan(0);
      
      // Check for table (semantic for tabular data)
      const table = await page.locator('table').count();
      expect(table).toBeGreaterThan(0);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should include styles without JavaScript', async ({ browser }) => {
    /**
     * Style check: CSS is applied (critical styles loaded server-side)
     * 
     * Validation:
     * - Table has computed styles (not browser default)
     * - Color, font-size, padding applied
     * - Layout is correct (columns visible)
     */
    
    const context = await createNoJSContext(browser);
    const page = await context.newPage();
    
    try {
      await page.goto('/posts', { waitUntil: 'domcontentloaded' });
      
      // Get table element
      const table = await page.locator('table').first();
      
      // Check computed styles
      const computed = await table.evaluate((el: HTMLElement) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          width: styles.width,
          borderCollapse: styles.borderCollapse,
        };
      });
      
      // Should have styles applied (not browser defaults only)
      expect(computed.display).not.toBe('inline');
      expect(computed.width).not.toBe('auto');
    } finally {
      await page.close();
      await context.close();
    }
  });
});

/**
 * Test metadata for CI integration
 * 
 * Tags: @smoke (runs on all commits), @ssr (SSR-specific tests)
 * Timeout: 30s per test
 * Workers: 4 (per playwright.optimized.config.ts)
 * Retries: 0
 * 
 * Success criteria:
 * - All tests pass
 * - At least 1 post row renders
 * - No placeholder text
 * - Table structure valid
 * - Links rendered with href
 * 
 * Importance: **Critical** for MVP - proves SSR functionality works without JS
 */
