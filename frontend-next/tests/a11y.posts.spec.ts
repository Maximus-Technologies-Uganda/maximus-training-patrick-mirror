import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("/posts accessibility", () => {
  test("axe smoke scan and basic roles", async ({ page }) => {
    await page.goto("/posts");
    await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("main")).toBeVisible();

    const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    const results = await axe.analyze();
    expect(results.violations, results.violations.map((v) => v.id).join(", ")).toEqual([]);
  });
});


