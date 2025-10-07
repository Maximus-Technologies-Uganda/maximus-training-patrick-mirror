import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Core flows and accessibility", () => {
  test("Posts list page shows heading and has no critical/serious a11y issues", async ({ page }) => {
    await page.goto("/posts");

    await expect(page.getByRole("heading", { level: 1, name: "Posts" })).toBeVisible();

    const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);
    const results = await axe.analyze();
    const severe = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      severe,
      severe.map((v) => v.id).join(", "),
    ).toEqual([]);
  });

  test("Create post form is present and has no critical/serious a11y issues", async ({ page }) => {
    await page.goto("/posts");

    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(page.getByLabel("Content")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create" })).toBeVisible();

    const axe = new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"]) // Scope to the create post form only
      .include("form");
    const results = await axe.analyze();
    const severe = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      severe,
      severe.map((v) => v.id).join(", "),
    ).toEqual([]);
  });
});


