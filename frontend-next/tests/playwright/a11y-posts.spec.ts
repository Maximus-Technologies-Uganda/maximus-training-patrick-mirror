import { test } from "@playwright/test";

test.describe("Posts A11y Tests", () => {
  test("posts page has no critical violations", async () => {
    // TODO: Test a11y with axe-core
    // - Load /posts page
    // - Inject axe
    // - Assert 0 critical violations
  });

  test("all inputs have associated labels", async () => {
    // TODO: Test input labeling
  });

  test("pagination controls are keyboard accessible", async () => {
    // TODO: Test keyboard navigation
  });
});
