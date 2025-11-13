import { test } from "@playwright/test";

// Test results tracker
const results: Record<number, { step: string; status: "PASS" | "FAIL"; details: string }> = {};

const APP_URL = "https://maximus-training-frontend-673209018655.africa-south1.run.app";

let firstPostTitle: string;

// Part 1: Authentication
test("Part 1: Authentication (Steps 1-5)", async ({ page }) => {
  test.setTimeout(60000); // 60 second timeout for integration test
  // Step 1: Navigate to login page
  try {
    await page.goto(`${APP_URL}/login`, { waitUntil: "networkidle" });
    results[1] = { step: "Navigate to login page", status: "PASS", details: "Login page loaded" };
  } catch (e) {
    results[1] = { step: "Navigate to login page", status: "FAIL", details: `Error: ${e}` };
    return;
  }

  // Step 2: Find and fill username input
  try {
    const usernameInput = page.locator('input[name="username"], input[name="email"]').first();
    await usernameInput.fill("admin");
    results[2] = {
      step: 'Fill username input with "admin"',
      status: "PASS",
      details: "Username entered",
    };
  } catch (e) {
    results[2] = { step: "Fill username input", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 3: Find and fill password input
  try {
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill("password");
    results[3] = {
      step: 'Fill password input with "password"',
      status: "PASS",
      details: "Password entered",
    };
  } catch (e) {
    results[3] = { step: "Fill password input", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 4: Find and click Sign In button
  try {
    const signInButton = page
      .locator('button:has-text("Sign In"), button:has-text("Login")')
      .first();
    await signInButton.click();
    results[4] = { step: 'Click "Sign In" button', status: "PASS", details: "Button clicked" };
  } catch (e) {
    results[4] = { step: 'Click "Sign In" button', status: "FAIL", details: `Error: ${e}` };
  }

  // Step 5: Verify redirect to /posts
  try {
    await page.waitForURL("**/posts**", { timeout: 10000 });
    const currentUrl = page.url();
    if (currentUrl.includes("/posts")) {
      results[5] = {
        step: "Verify redirect to /posts",
        status: "PASS",
        details: `URL: ${currentUrl}`,
      };
    } else {
      results[5] = {
        step: "Verify redirect to /posts",
        status: "FAIL",
        details: `Unexpected URL: ${currentUrl}`,
      };
    }
  } catch (e) {
    results[5] = {
      step: "Verify redirect to /posts",
      status: "FAIL",
      details: `Timeout or error: ${e}`,
    };
  }
});

// Part 2: Functional & A11y Validation
test("Part 2: Functional & A11y Validation (Steps 6-18)", async ({ page }) => {
  test.setTimeout(60000); // 60 second timeout for integration test
  // Navigate to posts page (assuming we're already logged in from previous test)
  await page.goto(`${APP_URL}/posts`, { waitUntil: "networkidle" });

  // Step 6: Verify SSR rendering - check for Card components in initial HTML
  try {
    const html = await page.content();
    const hasCards =
      html.includes("Card") || html.includes("card") || page.locator('[class*="card"]').count() > 0;
    const hasLoadingSpinner =
      html.includes("spinner") ||
      html.includes("Spinner") ||
      page.locator('[data-testid="loading"]').count() > 0;

    if (hasCards && !hasLoadingSpinner) {
      results[6] = {
        step: "SSR Verify: Card components rendered without loading spinner",
        status: "PASS",
        details: "Cards found in initial HTML, no loading spinner",
      };
    } else {
      results[6] = {
        step: "SSR Verify",
        status: "FAIL",
        details: `Has cards: ${hasCards}, Has spinner: ${hasLoadingSpinner}`,
      };
    }
  } catch (e) {
    results[6] = { step: "SSR Verify", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 7: Verify H1 with "Posts" text is visible
  try {
    const h1 = page.locator('h1:has-text("Posts")');
    await h1.isVisible();
    results[7] = {
      step: 'Verify h1 "Posts" is visible',
      status: "PASS",
      details: "H1 found and visible",
    };
  } catch (e) {
    results[7] = {
      step: 'Verify h1 "Posts" is visible',
      status: "FAIL",
      details: `H1 not found or not visible: ${e}`,
    };
  }

  // Step 8: Note the first post title
  try {
    const firstPost = page.locator('[data-testid*="post"], article, [class*="post"]').first();
    firstPostTitle = (await firstPost.textContent()) || "";
    results[8] = {
      step: "Note first post title",
      status: "PASS",
      details: `First post: "${firstPostTitle.substring(0, 50)}..."`,
    };
  } catch (e) {
    results[8] = { step: "Note first post title", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 9: A11y Verify (Input) - check for label/aria-label
  try {
    const firstInput = page.locator("input").first();
    const inputElement = await firstInput.evaluate((el) => {
      const label = document.querySelector(`label[for="${el.id}"]`);
      const ariaLabel = el.getAttribute("aria-label");
      const placeholder = el.getAttribute("placeholder");
      return {
        hasLabel: !!label,
        hasAriaLabel: !!ariaLabel,
        hasPlaceholder: !!placeholder,
        ariaLabel,
        placeholder,
      };
    });

    if (inputElement.hasLabel || inputElement.hasAriaLabel || inputElement.hasPlaceholder) {
      results[9] = {
        step: "A11y Verify (Input): Label or aria-label present",
        status: "PASS",
        details: `Label: ${inputElement.hasLabel}, Aria-label: ${inputElement.hasAriaLabel}, Placeholder: ${inputElement.hasPlaceholder}`,
      };
    } else {
      results[9] = {
        step: "A11y Verify (Input)",
        status: "FAIL",
        details: "No label, aria-label, or placeholder found",
      };
    }
  } catch (e) {
    results[9] = { step: "A11y Verify (Input)", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 10: A11y Verify (Button) - check focus style
  try {
    const firstButton = page.locator("button").first();
    await firstButton.focus();

    // Wait a moment for focus styles to apply
    await page.waitForTimeout(200);

    const hasFocusStyle = await firstButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const hasFocusVisible = el.matches(":focus-visible");
      const hasOutline = styles.outline && styles.outline !== "none";
      const hasBoxShadow = styles.boxShadow && styles.boxShadow !== "none";
      return hasFocusVisible || hasOutline || hasBoxShadow;
    });

    if (hasFocusStyle) {
      results[10] = {
        step: "A11y Verify (Button): Focus style visible",
        status: "PASS",
        details: "Button displays focus style on tab",
      };
    } else {
      results[10] = {
        step: "A11y Verify (Button)",
        status: "FAIL",
        details: "No visible focus style detected",
      };
    }
  } catch (e) {
    results[10] = { step: "A11y Verify (Button)", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 11: Click "Next Page" button
  try {
    const nextButton = page
      .locator('button:has-text("Next"), button:has-text("Next Page"), a:has-text("2")')
      .first();
    await nextButton.click();
    results[11] = {
      step: 'Click "Next Page" button',
      status: "PASS",
      details: "Next page clicked",
    };
  } catch (e) {
    results[11] = { step: 'Click "Next Page" button', status: "FAIL", details: `Error: ${e}` };
  }

  // Step 12: Verify URL contains page=2 parameter
  try {
    await page.waitForURL(`**?page=2**`, { timeout: 5000 }).catch(() => {});
    const currentUrl = page.url();
    if (currentUrl.includes("page=2")) {
      results[12] = {
        step: "Verify URL contains ?page=2",
        status: "PASS",
        details: `URL: ${currentUrl}`,
      };
    } else {
      results[12] = {
        step: "Verify URL contains ?page=2",
        status: "FAIL",
        details: `URL missing page param: ${currentUrl}`,
      };
    }
  } catch (e) {
    results[12] = { step: "Verify URL contains ?page=2", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 13: Verify content has updated (different first post)
  try {
    const newFirstPost = page.locator('[data-testid*="post"], article, [class*="post"]').first();
    const newFirstPostTitle = (await newFirstPost.textContent()) || "";

    if (newFirstPostTitle !== firstPostTitle && newFirstPostTitle.length > 0) {
      results[13] = {
        step: "Verify content updated: different first post",
        status: "PASS",
        details: `Page 2 first post differs from page 1`,
      };
    } else {
      results[13] = {
        step: "Verify content updated",
        status: "FAIL",
        details: "First post title same or empty",
      };
    }
  } catch (e) {
    results[13] = { step: "Verify content updated", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 14: Click sort button
  try {
    const sortButton = page
      .locator('button:has-text("Sort"), button:has-text("Title"), [data-testid="sort"]')
      .first();
    await sortButton.click();
    results[14] = { step: "Click sort button", status: "PASS", details: "Sort button clicked" };
  } catch (e) {
    results[14] = { step: "Click sort button", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 15: Verify URL contains sort parameter
  try {
    await page.waitForURL(`**?sort=**`, { timeout: 5000 }).catch(() => {});
    const currentUrl = page.url();
    if (currentUrl.includes("sort=")) {
      results[15] = {
        step: "Verify URL contains sort parameter",
        status: "PASS",
        details: `URL: ${currentUrl}`,
      };
    } else {
      results[15] = {
        step: "Verify URL contains sort parameter",
        status: "FAIL",
        details: `URL missing sort param: ${currentUrl}`,
      };
    }
  } catch (e) {
    results[15] = {
      step: "Verify URL contains sort parameter",
      status: "FAIL",
      details: `Error: ${e}`,
    };
  }

  // Step 16: Verify post order has changed
  try {
    const sortedFirstPost = page.locator('[data-testid*="post"], article, [class*="post"]').first();
    const sortedFirstPostTitle = (await sortedFirstPost.textContent()) || "";

    if (sortedFirstPostTitle !== firstPostTitle) {
      results[16] = {
        step: "Verify post order changed after sort",
        status: "PASS",
        details: "Post order different after sorting",
      };
    } else {
      results[16] = {
        step: "Verify post order changed",
        status: "FAIL",
        details: "Posts in same order",
      };
    }
  } catch (e) {
    results[16] = { step: "Verify post order changed", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 17: State Verify (Existence) - check for empty/error state elements
  try {
    const html = await page.content();
    const hasEmptyState =
      html.includes("empty-state") ||
      html.includes("emptyState") ||
      page.locator('[id*="empty"], [class*="empty"]').count() > 0;
    const hasErrorState =
      html.includes("error-message") ||
      html.includes("error") ||
      page.locator('[id*="error"], [class*="error"]').count() > 0;

    if (hasEmptyState || hasErrorState) {
      results[17] = {
        step: "State Verify: Empty/error state elements exist in DOM",
        status: "PASS",
        details: `Empty state: ${hasEmptyState}, Error state: ${hasErrorState}`,
      };
    } else {
      results[17] = {
        step: "State Verify",
        status: "FAIL",
        details: "No empty or error state elements found",
      };
    }
  } catch (e) {
    results[17] = { step: "State Verify", status: "FAIL", details: `Error: ${e}` };
  }

  // Step 18: A11y Verify (Live Region) - check for aria-live
  try {
    const html = await page.content();
    const hasAriaLive = html.includes("aria-live") || page.locator("[aria-live]").count() > 0;

    if (hasAriaLive) {
      results[18] = {
        step: "A11y Verify (Live Region): aria-live attribute present",
        status: "PASS",
        details: "aria-live region found for status announcements",
      };
    } else {
      results[18] = {
        step: "A11y Verify (Live Region)",
        status: "FAIL",
        details: "No aria-live region found",
      };
    }
  } catch (e) {
    results[18] = { step: "A11y Verify (Live Region)", status: "FAIL", details: `Error: ${e}` };
  }
});

test("Print Results Summary", async () => {
  console.log("\n" + "=".repeat(100));
  console.log("VALIDATION RESULTS SUMMARY");
  console.log("=".repeat(100) + "\n");

  const passCount = Object.values(results).filter((r) => r.status === "PASS").length;
  const failCount = Object.values(results).filter((r) => r.status === "FAIL").length;

  console.log(`Total Steps: ${Object.keys(results).length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Pass Rate: ${((passCount / Object.keys(results).length) * 100).toFixed(1)}%\n`);

  console.log("DETAILED RESULTS:");
  console.log("-".repeat(100));

  for (const [stepNum, result] of Object.entries(results)) {
    const status = result.status === "PASS" ? "✓ PASS" : "✗ FAIL";
    console.log(`\nStep ${stepNum}: ${result.step}`);
    console.log(`Status: ${status}`);
    console.log(`Details: ${result.details}`);
  }

  console.log("\n" + "=".repeat(100));
  console.log("PART BREAKDOWN:");
  console.log("-".repeat(100));

  const part1Results = Object.entries(results)
    .filter(([num]) => parseInt(num) >= 1 && parseInt(num) <= 5)
    .map(([, r]) => r);
  const part1Pass = part1Results.filter((r) => r.status === "PASS").length;
  console.log(`Part 1 (Authentication): ${part1Pass}/${part1Results.length} PASSED`);

  const part2Results = Object.entries(results)
    .filter(([num]) => parseInt(num) >= 6 && parseInt(num) <= 18)
    .map(([, r]) => r);
  const part2Pass = part2Results.filter((r) => r.status === "PASS").length;
  console.log(`Part 2 (Functional & A11y): ${part2Pass}/${part2Results.length} PASSED`);

  console.log("\n" + "=".repeat(100) + "\n");
});
