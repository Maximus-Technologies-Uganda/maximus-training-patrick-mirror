import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

test.describe("/posts accessibility", () => {
  test("smoke axe check", async ({ page }) => {
    await page.goto("/posts");
    const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    const results = await axe.analyze();

    // Persist a11y results for Quality Gate (specs/005-week-6-finishers/plan.md FR-004)
    // Location expected by scripts/quality-gate/build-review-packet.js and aggregate-results.js
    const repoRoot = path.resolve(__dirname, "..", "..", "..");
    const outDir = path.join(repoRoot, "a11y");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "report.json");
    fs.writeFileSync(outFile, JSON.stringify({ violations: results.violations }, null, 2) + "\n", "utf8");

    expect(results.violations, results.violations.map((violation) => violation.id).join(", ")).toEqual([]);
  });
});
