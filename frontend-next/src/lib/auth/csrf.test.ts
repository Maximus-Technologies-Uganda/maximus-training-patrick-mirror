import { describe, it, expect, beforeEach } from "vitest";
import { getCsrfTokenFromCookie, withCsrf } from "./csrf";

describe("getCsrfTokenFromCookie", () => {
  beforeEach(() => {
    // Reset document.cookie before each test
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("extracts CSRF token from cookie", () => {
    document.cookie = "csrf=test-token-123";
    expect(getCsrfTokenFromCookie()).toBe("test-token-123");
  });

  it("handles URL-encoded tokens", () => {
    document.cookie = "csrf=test%20token%20with%20spaces";
    expect(getCsrfTokenFromCookie()).toBe("test token with spaces");
  });

  it("returns empty string when cookie is not present", () => {
    document.cookie = "other=value";
    expect(getCsrfTokenFromCookie()).toBe("");
  });

  it("returns empty string when no cookies exist", () => {
    document.cookie = "";
    expect(getCsrfTokenFromCookie()).toBe("");
  });

  it("extracts token when multiple cookies exist", () => {
    document.cookie = "session=abc123; csrf=token-xyz; other=value";
    expect(getCsrfTokenFromCookie()).toBe("token-xyz");
  });

  it("handles cookie with semicolon separator", () => {
    document.cookie = "csrf=token-value; Path=/";
    expect(getCsrfTokenFromCookie()).toBe("token-value");
  });

  it("returns empty string when cookie parsing throws", () => {
    // Mock document.cookie to throw an error
    Object.defineProperty(document, "cookie", {
      get: () => {
        throw new Error("Cookie access denied");
      },
      configurable: true,
    });

    expect(getCsrfTokenFromCookie()).toBe("");
  });
});

describe("withCsrf", () => {
  beforeEach(() => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });
  });

  it("adds CSRF token to headers when token exists", () => {
    document.cookie = "csrf=test-token";
    const init: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    const result = withCsrf(init);
    const headers = result.headers as Headers;

    expect(headers.get("X-CSRF-Token")).toBe("test-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("does not add CSRF token when token is missing", () => {
    document.cookie = "";
    const init: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    const result = withCsrf(init);
    const headers = result.headers as Headers;

    expect(headers.get("X-CSRF-Token")).toBeNull();
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("preserves existing headers", () => {
    document.cookie = "csrf=token-123";
    const init: RequestInit = {
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json",
      },
    };

    const result = withCsrf(init);
    const headers = result.headers as Headers;

    expect(headers.get("X-CSRF-Token")).toBe("token-123");
    expect(headers.get("Authorization")).toBe("Bearer token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("sets credentials to include when not specified", () => {
    document.cookie = "csrf=token";
    const init: RequestInit = {
      method: "POST",
    };

    const result = withCsrf(init);

    expect(result.credentials).toBe("include");
  });

  it("preserves existing credentials", () => {
    document.cookie = "csrf=token";
    const init: RequestInit = {
      method: "POST",
      credentials: "same-origin",
    };

    const result = withCsrf(init);

    expect(result.credentials).toBe("same-origin");
  });

  it("handles undefined init", () => {
    document.cookie = "csrf=token";
    const result = withCsrf();

    expect(result.headers).toBeInstanceOf(Headers);
    const headers = result.headers as Headers;
    expect(headers.get("X-CSRF-Token")).toBe("token");
    expect(result.credentials).toBe("include");
  });

  it("handles string headers", () => {
    document.cookie = "csrf=token";
    const init: RequestInit = {
      headers: "Content-Type: application/json",
    };

    const result = withCsrf(init);
    const headers = result.headers as Headers;

    expect(headers.get("X-CSRF-Token")).toBe("token");
  });

  it("handles array headers", () => {
    document.cookie = "csrf=token";
    const init: RequestInit = {
      headers: [["Content-Type", "application/json"]],
    };

    const result = withCsrf(init);
    const headers = result.headers as Headers;

    expect(headers.get("X-CSRF-Token")).toBe("token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });
});
