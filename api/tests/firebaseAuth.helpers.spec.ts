import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  base64UrlToBase64,
  decodeJwtPayload,
  normalizeAudience,
  normalizeNumericClaim,
  extractAuthTimeSeconds,
  resolveFirebaseProjectId,
} from "../src/middleware/firebaseAuth";

type MutableEnv = NodeJS.ProcessEnv & Record<string, string | undefined>;

const ORIGINAL_ENV: MutableEnv = { ...process.env };

describe("firebaseAuth helper utilities", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("converts base64url strings to padded base64", () => {
    expect(base64UrlToBase64("abcd-_")).toBe("abcd+/==");
    expect(base64UrlToBase64("YWJj")).toBe("YWJj");
  });

  it("decodes JWT payloads and returns null on malformed input", () => {
    const payload = Buffer.from(JSON.stringify({ foo: "bar" }))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    expect(decodeJwtPayload(`aaa.${payload}.bbb`)).toEqual({ foo: "bar" });
    expect(decodeJwtPayload("invalid.token")).toBeNull();
    const badJson = Buffer.from("not-json")
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    expect(decodeJwtPayload(`aaa.${badJson}.bbb`)).toBeNull();
  });

  it("normalizes audience claims", () => {
    expect(normalizeAudience("proj-123")).toBe("proj-123");
    expect(normalizeAudience("   ")).toBeUndefined();
    expect(normalizeAudience(["", "aud-456", "other"])).toBe("aud-456");
    expect(normalizeAudience(["", " "])).toBeUndefined();
  });

  it("normalizes numeric claims", () => {
    expect(normalizeNumericClaim(123)).toBe(123);
    expect(normalizeNumericClaim("456")).toBe(456);
    expect(normalizeNumericClaim("not-a-number")).toBeNull();
  });

  it("extracts auth time falling back to issued-at", () => {
    const withAuthTime = extractAuthTimeSeconds({
      auth_time: 1690000100,
      iat: 0,
    } as Parameters<typeof extractAuthTimeSeconds>[0]);
    expect(withAuthTime).toBe(1690000100);

    const fallbackToIat = extractAuthTimeSeconds({
      auth_time: undefined,
      iat: "1690000200",
    } as Parameters<typeof extractAuthTimeSeconds>[0]);
    expect(fallbackToIat).toBe(1690000200);

    const missingClaims = extractAuthTimeSeconds({
      auth_time: undefined,
      iat: "not-a-number",
    } as Parameters<typeof extractAuthTimeSeconds>[0]);
    expect(missingClaims).toBeNull();
  });

  it("resolves firebase project id with precedence", () => {
    (process.env as MutableEnv).FIREBASE_ADMIN_PROJECT_ID = "admin-id";
    (process.env as MutableEnv).FIREBASE_PROJECT_ID = "   ";
    (process.env as MutableEnv).FIREBASE_AUTH_PROJECT_ID = "auth-id";
    (process.env as MutableEnv).NEXT_PUBLIC_FIREBASE_PROJECT_ID = "next-id";
    (process.env as MutableEnv).GCP_PROJECT_ID = "gcp-id";

    expect(resolveFirebaseProjectId()).toBe("admin-id");

    delete (process.env as MutableEnv).FIREBASE_ADMIN_PROJECT_ID;
    expect(resolveFirebaseProjectId()).toBe("auth-id");

    delete (process.env as MutableEnv).FIREBASE_AUTH_PROJECT_ID;
    expect(resolveFirebaseProjectId()).toBe("next-id");

    delete (process.env as MutableEnv).NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    expect(resolveFirebaseProjectId()).toBe("gcp-id");

    delete (process.env as MutableEnv).GCP_PROJECT_ID;
    expect(resolveFirebaseProjectId()).toBeUndefined();
  });
});
