import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

/**
 * Accessibility Tests for Phase 2 Design System Components
 *
 * Tests all Phase 2 components for WCAG 2.1 AA compliance:
 * - Button (3 variants × 3 sizes × states)
 * - Input (with label, error, description)
 * - Card (header, body, footer)
 * - LoadingState, EmptyState, ErrorState
 * - PaginationControls
 *
 * Uses the /design-system-demo page which showcases all components.
 */
test.describe("Design System - Accessibility (WCAG 2.1 AA)", () => {
  test("Phase 2 components have no critical a11y violations", async ({ page }) => {
    // Navigate to design system demo page
    await page.goto("/design-system-demo");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Run axe accessibility scan with WCAG 2.1 Level A and AA rules
    const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    const results = await axe.analyze();

    // Persist a11y results for Quality Gate
    const repoRoot = path.resolve(__dirname, "..", "..");
    const outDir = path.join(repoRoot, "a11y");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "design-system-report.json");
    fs.writeFileSync(
      outFile,
      JSON.stringify({
        url: "/design-system-demo",
        timestamp: new Date().toISOString(),
        violations: results.violations,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
      }, null, 2) + "\n",
      "utf8"
    );

    // Assert 0 violations
    expect(
      results.violations,
      results.violations.map((v) => `${v.id}: ${v.description}`).join("\n")
    ).toEqual([]);
  });

  test("Button component has proper focus indicators", async ({ page }) => {
    await page.goto("/design-system-demo");

    // Find first Button
    const button = page.locator('button').first();

    // Focus the button
    await button.focus();

    // Verify focus styles are applied (ring-2 class)
    const className = await button.getAttribute('class');
    expect(className).toContain('focus:ring-2');
  });

  test("Input component has proper label associations", async ({ page }) => {
    await page.goto("/design-system-demo");

    // Find all inputs
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="password"], input[type="tel"]');
    const count = await inputs.count();

    // Verify each input has an associated label
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');

      // Find label with for attribute matching input id
      const label = page.locator(`label[for="${inputId}"]`);
      await expect(label).toBeVisible();
    }
  });

  test("Error states have proper ARIA attributes", async ({ page }) => {
    await page.goto("/design-system-demo");

    // Find Input with error state
    const errorInput = page.locator('input[aria-invalid="true"]').first();
    await expect(errorInput).toBeVisible();

    // Verify it has aria-describedby pointing to error message
    const describedBy = await errorInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // Verify error message exists and has role="alert"
    const errorMessage = page.locator(`#${describedBy}`);
    await expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  test("PaginationControls is keyboard accessible", async ({ page }) => {
    await page.goto("/design-system-demo");

    // Find pagination nav
    const paginationNav = page.locator('nav[aria-label="Pagination"]');
    await expect(paginationNav).toBeVisible();

    // Find Previous and Next buttons
    const prevButton = page.getByRole('button', { name: /previous/i });
    const nextButton = page.getByRole('button', { name: /next/i });

    // Tab to Next button and verify it's focusable
    await nextButton.focus();
    await expect(nextButton).toBeFocused();

    // Verify buttons have proper aria-labels
    await expect(prevButton).toHaveAttribute('aria-label', 'Go to previous page');
    await expect(nextButton).toHaveAttribute('aria-label', 'Go to next page');
  });

  test("LoadingState announces to screen readers", async ({ page }) => {
    await page.goto("/design-system-demo");

    // Find LoadingState component
    const loadingState = page.locator('[role="status"][aria-live="polite"]');
    await expect(loadingState).toBeVisible();

    // Verify it contains loading message
    await expect(loadingState).toContainText('Loading');
  });

  test("ErrorState alerts are assertive", async ({ page }) => {
    await page.goto("/design-system-demo");

    // Find ErrorState component
    const errorState = page.locator('[role="alert"][aria-live="assertive"]');
    await expect(errorState).toBeVisible();

    // Verify it contains error message
    await expect(errorState).toContainText('Error');
  });
});
