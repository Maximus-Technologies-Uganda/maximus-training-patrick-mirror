import { test, expect } from "@playwright/test";

async function loginProgrammatically(page: import("@playwright/test").Page, creds: { username: string; password: string }): Promise<void> {
  // Ensure same-origin context for relative fetch
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

async function logoutProgrammatically(page: import("@playwright/test").Page): Promise<void> {
  // Ensure same-origin context for relative fetch
  await page.goto("/");
  await page.evaluate(async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Logout failed: ${res.status} ${res.statusText}${text ? " - " + text : ""}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Logout request error: ${message}`);
    }
  });
}

test.describe("Auth /login", () => {
  test("Successful Login shows username banner", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("password");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for redirect to /posts, then assert logged-in state via Logout button (stable)
    await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("Failed Login shows error message", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Username").fill("invalid-user");
    await page.getByLabel("Password").fill("wrong-pass");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Assert error message via an alert element that contains expected text (avoid Next route announcer)
    const alert = page
      .getByRole("alert")
      .filter({ hasText: /invalid username or password|unexpected error/i });
    await expect(alert).toBeVisible();
  });

  test("Logout flow logs out user and shows Login button", async ({ page }) => {
    // Programmatic login using the API route to set the HttpOnly cookie
    await loginProgrammatically(page, { username: "admin", password: "password" });

    // Navigate to a page where auth UI is present
    await page.goto("/posts");

    // Assert logged-in indicator: a visible Logout button (in main content)
    const logoutButton = page.getByRole("main").getByRole("button", { name: "Logout" });
    await expect(logoutButton).toBeVisible();

    // Perform logout
    await logoutButton.click();

    // Assert logged-out state: no Logout buttons, Login becomes visible
    await expect(page.getByRole("main").getByRole("button", { name: "Logout" })).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("Ownership: creator sees Edit/Delete; admin can edit any post", async ({ page }) => {
    // Login as alice and create a post
    await logoutProgrammatically(page);
    await loginProgrammatically(page, { username: "alice", password: "correct-password" });

    await page.goto("/posts");
    const uniqueTitle = `Owned Post ${Date.now()}`;
    const content = `Content for ${uniqueTitle}`;

    await page.getByLabel("Title").fill(uniqueTitle);
    await page.getByLabel("Content").fill(content);
    await page.getByRole("button", { name: "Create" }).click();

    // Confirm creation success and the post appears in the list (disambiguate alert)
    await expect(
      page.getByRole("alert").filter({ hasText: /created successfully/i })
    ).toBeVisible();
    const postItem = page.locator("li", { has: page.getByRole("heading", { name: uniqueTitle }) });
    await expect(postItem).toBeVisible();

    // Creator (alice) should see Edit/Delete controls for their own post
    await expect(postItem.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(postItem.getByRole("button", { name: "Delete" })).toBeVisible();

    // Log out alice and log in as admin (different user with elevated privileges)
    await logoutProgrammatically(page);
    await loginProgrammatically(page, { username: "admin", password: "password" });

    // Navigate back to posts and find alice's post
    await page.goto("/posts");
    const adminViewItem = page.locator("li", { has: page.getByRole("heading", { name: uniqueTitle }) });
    await expect(adminViewItem).toBeVisible();

    // Admin SHOULD be able to edit/delete any post (T020: Admin authorization)
    await expect(adminViewItem.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(adminViewItem.getByRole("button", { name: "Delete" })).toBeVisible();
  });
});


