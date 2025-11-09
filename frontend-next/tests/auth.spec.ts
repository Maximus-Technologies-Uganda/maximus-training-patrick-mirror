import { test, expect } from "@playwright/test";

async function loginProgrammatically(
  page: import("@playwright/test").Page,
  creds: { username: string; password: string }
): Promise<void> {
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
        throw new Error(
          `Logout failed: ${res.status} ${res.statusText}${text ? " - " + text : ""}`
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Logout request error: ${message}`);
    }
  });
}

test.describe("Auth /login", () => {
  test("Successful login stores session and shows signed-in banner", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("User ID").fill("admin-1");
    await page.getByLabel("Display name").fill("Admin User");
    await page.getByRole("button", { name: "Continue" }).click();

    // Wait for redirect to /posts, then assert logged-in state via banner + sign-out control
    await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("main")).toContainText("Signed in as Admin User");
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("Continue button stays disabled until both fields are populated", async ({ page }) => {
    await page.goto("/login");

    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeDisabled();

    await page.getByLabel("User ID").fill("owner-123");
    await expect(continueButton).toBeDisabled();

    await page.getByLabel("Display name").fill(" ");
    await expect(continueButton).toBeDisabled();

    await page.getByLabel("Display name").fill("Owner User");
    await expect(continueButton).toBeEnabled();

    await page.getByLabel("Display name").fill("  ");
    await expect(continueButton).toBeDisabled();
  });

  test("Logout flow clears session and shows Sign in link", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("User ID").fill("logout-user");
    await page.getByLabel("Display name").fill("Logout User");
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByRole("heading", { name: "Posts", level: 1 })).toBeVisible({
      timeout: 15000,
    });
    const signOutButton = page.getByRole("button", { name: "Sign out" });
    await expect(signOutButton).toBeVisible();

    await signOutButton.click();

    await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test.skip("Ownership: creator sees Edit/Delete; admin can edit any post", async ({ page }) => {
    // SKIPPED: Phase 5 Feature - Post ownership tracking not yet implemented in backend
    // This test requires the API to return post owner information and support ownership-based authorization.
    // Frontend components (Edit/Delete buttons) are already prepared with owner checks in PostsList component.
    //
    // Requirements for Phase 5:
    // - API: Return post.ownerId in GET /posts response
    // - API: Check authorization for PUT/DELETE /posts/:id (allow owner or admin)
    // - Frontend: Filter Edit/Delete buttons based on currentUserId === post.ownerId
    //
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
    const adminViewItem = page.locator("li", {
      has: page.getByRole("heading", { name: uniqueTitle }),
    });
    await expect(adminViewItem).toBeVisible();

    // Admin SHOULD be able to edit/delete any post (T020: Admin authorization)
    await expect(adminViewItem.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(adminViewItem.getByRole("button", { name: "Delete" })).toBeVisible();
  });
});
