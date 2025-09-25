import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("/posts accessibility", () => {
  test("smoke axe check", async ({ page }) => {
    await page.goto("/posts");
    const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    const results = await axe.analyze();

    expect(results.violations, results.violations.map((violation) => violation.id).join(", ")).toEqual([]);
  });
});
