import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function loginProgrammatically(page: import("@playwright/test").Page, creds: { username: string; password: string }): Promise<void> {
  await page.goto("/");
  await page.evaluate(async (payload) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Login failed: ${res.status} ${res.statusText}${text ? " - " + text : ""}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Login request error: ${message}`);
    }
  }, creds);
}

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
    // Ensure we're authenticated so the create form renders
    await loginProgrammatically(page, { username: "admin", password: "password" });
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


