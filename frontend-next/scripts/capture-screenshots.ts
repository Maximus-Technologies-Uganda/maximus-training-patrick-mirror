/**
 * Capture Screenshots Script
 *
 * Takes screenshots of Phase 2 design system components
 * for documentation and PR visual evidence.
 */
import { chromium, Browser, Page } from "@playwright/test";
import path from "path";
import fs from "fs/promises";

const DEMO_URL = "http://localhost:3001/design-system-demo";
const SCREENSHOTS_DIR = path.join(__dirname, "../docs/screenshots");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function captureScreenshots() {
  console.log("🎬 Starting screenshot capture...");

  // Ensure screenshots directory exists
  await ensureDir(SCREENSHOTS_DIR);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });

  try {
    console.log(`📍 Navigating to ${DEMO_URL}...`);
    await page.goto(DEMO_URL, { waitUntil: "networkidle" });

    // Wait for page to be fully rendered
    await page.waitForTimeout(1000);

    // 1. Full page screenshot
    console.log("📸 Capturing full page...");
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "00-full-page.png"),
      fullPage: true,
    });

    // 2. Button component section
    console.log("📸 Capturing Button component...");
    const buttonSection = page.locator('section').filter({ hasText: 'Button' }).first();
    await buttonSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await buttonSection.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-button-component.png"),
    });

    // 3. Button variants
    console.log("📸 Capturing Button variants...");
    const buttonVariants = page.locator('h3').filter({ hasText: 'Variants' }).locator('..');
    await buttonVariants.scrollIntoViewIfNeeded();
    await buttonVariants.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-button-variants.png"),
    });

    // 4. Button sizes
    console.log("📸 Capturing Button sizes...");
    const buttonSizes = page.locator('h3').filter({ hasText: 'Sizes' }).locator('..');
    await buttonSizes.scrollIntoViewIfNeeded();
    await buttonSizes.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-button-sizes.png"),
    });

    // 5. Button states
    console.log("📸 Capturing Button states...");
    const buttonStates = page.locator('h3').filter({ hasText: 'States' }).locator('..');
    await buttonStates.scrollIntoViewIfNeeded();
    await buttonStates.screenshot({
      path: path.join(SCREENSHOTS_DIR, "04-button-states.png"),
    });

    // 6. Input component section
    console.log("📸 Capturing Input component...");
    const inputSection = page.locator('section').filter({ hasText: 'Input' }).first();
    await inputSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await inputSection.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-input-component.png"),
    });

    // 7. Input basic state
    console.log("📸 Capturing Input basic state...");
    const inputBasic = page.locator('input[placeholder="Enter your username"]').locator('..');
    await inputBasic.scrollIntoViewIfNeeded();
    await inputBasic.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-input-basic.png"),
    });

    // 8. Input error state
    console.log("📸 Capturing Input error state...");
    const inputError = page.locator('text=Password must be at least 8 characters').locator('../..');
    await inputError.scrollIntoViewIfNeeded();
    await inputError.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-input-error.png"),
    });

    // 9. Card component section
    console.log("📸 Capturing Card component...");
    const cardSection = page.locator('section').filter({ hasText: /^Card$/ }).first();
    await cardSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await cardSection.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-card-component.png"),
    });

    // 10. Composite components
    console.log("📸 Capturing Composite components...");
    const compositeSection = page.locator('section').filter({ hasText: 'Composite Components' }).first();
    await compositeSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await compositeSection.screenshot({
      path: path.join(SCREENSHOTS_DIR, "09-composite-components.png"),
    });

    // 11. LoadingState
    console.log("📸 Capturing LoadingState...");
    const loadingState = page.locator('text=Loading data...').locator('..');
    await loadingState.scrollIntoViewIfNeeded();
    await loadingState.screenshot({
      path: path.join(SCREENSHOTS_DIR, "10-loading-state.png"),
    });

    // 12. EmptyState
    console.log("📸 Capturing EmptyState...");
    const emptyState = page.locator('text=No items found').locator('../..');
    await emptyState.scrollIntoViewIfNeeded();
    await emptyState.screenshot({
      path: path.join(SCREENSHOTS_DIR, "11-empty-state.png"),
    });

    // 13. ErrorState
    console.log("📸 Capturing ErrorState...");
    const errorState = page.locator('text=Connection Error').locator('../..');
    await errorState.scrollIntoViewIfNeeded();
    await errorState.screenshot({
      path: path.join(SCREENSHOTS_DIR, "12-error-state.png"),
    });

    // 14. PaginationControls
    console.log("📸 Capturing PaginationControls...");
    const pagination = page.locator('nav[aria-label="Pagination"]');
    await pagination.scrollIntoViewIfNeeded();
    await pagination.screenshot({
      path: path.join(SCREENSHOTS_DIR, "13-pagination-controls.png"),
    });

    // 15. Real-world example
    console.log("📸 Capturing Real-world example...");
    const realWorldSection = page.locator('section').filter({ hasText: 'Real-World Example' }).first();
    await realWorldSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await realWorldSection.screenshot({
      path: path.join(SCREENSHOTS_DIR, "14-real-world-example.png"),
    });

    // 16. Design tokens
    console.log("📸 Capturing Design tokens...");
    const tokensSection = page.locator('section').filter({ hasText: 'Design Tokens' }).first();
    await tokensSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await tokensSection.screenshot({
      path: path.join(SCREENSHOTS_DIR, "15-design-tokens.png"),
    });

    console.log(`✅ Screenshots saved to ${SCREENSHOTS_DIR}`);
    console.log(`📁 Total screenshots: 16`);
  } catch (error) {
    console.error("❌ Error capturing screenshots:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the script
captureScreenshots().catch((error) => {
  console.error(error);
  process.exit(1);
});
