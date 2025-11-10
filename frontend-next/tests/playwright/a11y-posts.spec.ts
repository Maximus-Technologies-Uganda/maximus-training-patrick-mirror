import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

test.describe("Posts A11y Tests", () => {
  test("posts page has no critical violations", async ({ page }) => {
    await page.goto("/posts");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Run axe-core accessibility scan
    const axe = new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude("#__next"); // Exclude Next.js root element

    const results = await axe.analyze();

    // Persist a11y results for Quality Gate
    const repoRoot = path.resolve(__dirname, "..", "..", "..");
    const outDir = path.join(repoRoot, "a11y");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "posts-a11y-report.json");
    fs.writeFileSync(
      outFile,
      JSON.stringify({ violations: results.violations, passes: results.passes }, null, 2) + "\n",
      "utf8"
    );

    // Assert 0 critical violations (spec FR-018, SC-006)
    expect(
      results.violations,
      `Found ${results.violations.length} accessibility violations: ${results.violations.map((v) => v.id).join(", ")}`
    ).toEqual([]);
  });

  test("all inputs have associated labels", async ({ page }) => {
    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    // Find all input elements
    const inputs = await page.locator("input, select, textarea").all();

    for (const input of inputs) {
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      // Check if input has label via htmlFor, aria-label, or aria-labelledby
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label > 0) continue;
      }

      if (ariaLabel || ariaLabelledBy) continue;

      // If we get here, input has no label
      const tagName = await input.evaluate((el) => el.tagName);
      throw new Error(`Input ${tagName} has no associated label (spec FR-013)`);
    }
  });

  test("pagination controls are keyboard accessible", async ({ page }) => {
    await page.goto("/posts");
    await page.waitForLoadState("networkidle");

    // Find pagination buttons
    const nextButton = page.getByRole("button", { name: /next/i }).first();
    const prevButton = page.getByRole("button", { name: /previous|prev/i }).first();

    // Check if buttons exist
    const nextExists = (await nextButton.count()) > 0;
    const prevExists = (await prevButton.count()) > 0;

    if (nextExists || prevExists) {
      // Test keyboard navigation
      await page.keyboard.press("Tab");

      // Check if focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();

      // Test Enter key activation
      if (nextExists) {
        await nextButton.focus();
        const isEnabled = await nextButton.isEnabled();
        if (isEnabled) {
          await page.keyboard.press("Enter");
          // Verify URL changed (pagination worked)
          await page.waitForURL(/\?page=\d+/);
        }
      }
    }
  });
});
