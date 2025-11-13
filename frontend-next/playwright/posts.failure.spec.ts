import { test, expect } from "@playwright/test";

test.describe("Posts Failure Handling (T030)", () => {
  test("should show accessible error message when upstream fails", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("failed");
    });

    await page.goto("/posts");

    // Verify error message is visible
    const errorMsg = page.locator('[role="alert"]');
    await expect(errorMsg).toBeVisible();

    // Verify accessible error text
    const text = await errorMsg.textContent();
    expect(text).toContain("Failed");
  });

  test("should announce error via live region with role=alert", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("failed");
    });

    await page.goto("/posts");

    // Check for aria-live region with alert role
    const liveRegion = page.locator('[role="alert"]');
    await expect(liveRegion).toBeVisible();

    // Verify it has aria-live attribute
    const ariaLive = await liveRegion.getAttribute("aria-live");
    expect(["polite", "assertive"]).toContain(ariaLive);
  });

  test("should NOT display raw error stack trace", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("failed");
    });

    await page.goto("/posts");

    const pageText = await page.textContent("body");

    // Ensure no stack traces visible
    expect(pageText).not.toMatch(/Error:.*at /);
    expect(pageText).not.toMatch(/TypeError.*undefined/i);
    expect(pageText).not.toMatch(/\.ts:\d+:\d+/i);
  });

  test("should show user-friendly error message", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("failed");
    });

    await page.goto("/posts");

    const errorMsg = page.locator('[role="alert"]');
    const text = await errorMsg.textContent();

    // Should say something user-friendly, not technical
    expect(text?.toLowerCase()).toMatch(/(failed|error|unable|couldn't|problem)/i);
  });

  test("should show retry button/link on error", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("failed");
    });

    await page.goto("/posts");

    // Check for retry button or link
    const retryBtn = page.locator('button:has-text("Retry"), a:has-text("Retry")');
    await expect(retryBtn).toBeVisible();
  });

  test("should handle 500 server error gracefully", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.respond({
        status: 500,
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await page.goto("/posts");

    const errorMsg = page.locator('[role="alert"]');
    await expect(errorMsg).toBeVisible();

    const text = await errorMsg.textContent();
    expect(text).toBeTruthy();
  });

  test("should handle 503 service unavailable gracefully", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.respond({
        status: 503,
        body: JSON.stringify({ error: "Service Unavailable" }),
      });
    });

    await page.goto("/posts");

    const errorMsg = page.locator('[role="alert"]');
    await expect(errorMsg).toBeVisible();

    const text = await errorMsg.textContent();
    expect(text).toBeTruthy();
  });

  test("should handle network timeout gracefully", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("timedout");
    });

    await page.goto("/posts");

    const errorMsg = page.locator('[role="alert"]');
    await expect(errorMsg).toBeVisible();
  });

  test("should maintain page structure even on error", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("failed");
    });

    await page.goto("/posts");

    // Page should still have h1 title
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    const title = await h1.textContent();
    expect(title?.toLowerCase()).toContain("posts");
  });

  test("error should be announced to screen readers", async ({ page }) => {
    await page.route("**/api/posts", (route) => {
      route.abort("failed");
    });

    await page.goto("/posts");

    // Error region should be accessible
    const errorMsg = page.locator('[role="alert"]');
    const ariaLive = await errorMsg.getAttribute("aria-live");

    // At minimum, should have aria-live
    expect(ariaLive).toBeTruthy();
  });
});
