import { test, expect } from "@playwright/test";

type LoginCredentials = {
  username: string;
  password: string;
};

const DEFAULT_CREDENTIALS: LoginCredentials = {
  username: "alice",
  password: "correct-password",
};

async function loginViaApi(
  page: import("@playwright/test").Page,
  creds: LoginCredentials = DEFAULT_CREDENTIALS,
): Promise<void> {
  await page.goto("/");
  await page.evaluate(async (payload) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Login failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`,
      );
    }
  }, creds);

  await page.waitForFunction(() => document.cookie.includes("csrf="));
}

function usingHttps(baseUrl: string | undefined): boolean {
  if (!baseUrl) return false;
  try {
    return new URL(baseUrl).protocol === "https:";
  } catch {
    return false;
  }
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("SameSite Cookie Security", () => {
  test("login mints SameSite=Strict HttpOnly session cookie", async ({ page, context }) => {
    const info = test.info();
    await loginViaApi(page);

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === "session");
    const csrfCookie = cookies.find((cookie) => cookie.name === "csrf");

    expect(sessionCookie, "session cookie should be present").toBeDefined();
    expect(sessionCookie?.sameSite).toBe("Strict");
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.path).toBe("/");
    expect(sessionCookie?.value).not.toBe("");
    expect(sessionCookie?.expires ?? 0).toBeGreaterThan(Math.floor(Date.now() / 1000));

    const expectSecure = usingHttps(info.project.use.baseURL);
    expect(sessionCookie?.secure ?? false).toBe(expectSecure);

    expect(csrfCookie, "csrf double-submit token should be present").toBeDefined();
    expect(csrfCookie?.sameSite).toBe("Strict");
    expect(csrfCookie?.httpOnly ?? false).toBe(false);
  });

  test("HttpOnly session cookie is not accessible to client-side JavaScript", async ({ page }) => {
    await loginViaApi(page);

    const canReadSession = await page.evaluate(() => document.cookie.includes("session="));
    const canReadCsrf = await page.evaluate(() => document.cookie.includes("csrf="));

    expect(canReadSession).toBe(false);
    expect(canReadCsrf).toBe(true);
  });

  test("cross-site requests do not send SameSite=Strict session cookie", async ({ browser }) => {
    const info = test.info();
    const baseURL = info.project.use.baseURL ?? "http://localhost:3001";
    const origin = new URL(baseURL).origin;

    const loginContext = await browser.newContext({ baseURL });
    const loginPage = await loginContext.newPage();
    await loginViaApi(loginPage);
    const storageState = await loginContext.storageState();
    await loginContext.close();

    const attackerOrigin = "http://attacker.test";
    const attackerContext = await browser.newContext({
      storageState,
      baseURL: attackerOrigin,
    });

    await attackerContext.route(`${attackerOrigin}/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>attacker</body></html>",
      }),
    );

    let observedCookie: string | null = null;
    const originPattern = new RegExp(`^${escapeForRegex(origin)}/`);

    await attackerContext.route(`${origin}/**`, async (route) => {
      const request = route.request();
      if (originPattern.test(request.url()) && request.url().startsWith(`${origin}/api/`)) {
        observedCookie = await request.headerValue("cookie");
        await route.fulfill({
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": attackerOrigin,
            "Access-Control-Allow-Credentials": "true",
          },
          body: "{}",
        });
        return;
      }
      await route.continue();
    });

    const attackerPage = await attackerContext.newPage();
    await attackerPage.goto(`${attackerOrigin}/attack`);
    await attackerPage.evaluate(async (targetUrl) => {
      try {
        await fetch(targetUrl, {
          method: "GET",
          credentials: "include",
          mode: "cors",
        });
      } catch {
        // Ignore network errors; cookie policy is asserted separately.
      }
    }, `${origin}/api/posts`);

    expect(observedCookie).toBeNull();

    await attackerContext.close();
  });

  test("logout clears session and CSRF cookies", async ({ page, context }) => {
    await loginViaApi(page);

    let sessionCookie = (await context.cookies()).find((cookie) => cookie.name === "session");
    let csrfCookie = (await context.cookies()).find((cookie) => cookie.name === "csrf");
    expect(sessionCookie).toBeDefined();
    expect(csrfCookie).toBeDefined();

    await page.evaluate(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    });

    sessionCookie = (await context.cookies()).find((cookie) => cookie.name === "session");
    csrfCookie = (await context.cookies()).find((cookie) => cookie.name === "csrf");

    expect(sessionCookie).toBeUndefined();
    expect(csrfCookie).toBeUndefined();
  });
});
