import { test, expect } from "@playwright/test";

test.describe("observability", () => {
  test("propagates X-Request-Id via /api/posts", async ({ page }) => {
    const apiResponsePromise = page.waitForResponse((resp) => {
      try {
        const url = new URL(resp.url());
        return url.pathname === "/api/posts" && resp.request().method() === "GET";
      } catch {
        return false;
      }
    });

    await page.goto("/posts");

    const apiResp = await apiResponsePromise;
    const requestId = await apiResp.headerValue("x-request-id");

    expect(requestId).toBeTruthy();
    expect(typeof requestId).toBe("string");
    expect((requestId as string).trim().length).toBeGreaterThan(0);

    // Optional: check UUID format when the edge/API use uuid
    const uuidLike = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
    expect((requestId as string)).toMatch(uuidLike);
  });
});


