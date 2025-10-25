import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { withinClockSkew, isFirebaseIdTokenCandidate } from "../src/middleware/firebaseAuth";

function base64UrlEncode(input: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(input))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt(payload: Record<string, unknown>): string {
  const header = base64UrlEncode({ alg: "RS256", kid: "test" });
  const body = base64UrlEncode(payload);
  return `${header}.${body}.signature`;
}

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("Firebase auth semantics (unit-level)", () => {
  it("accepts timestamps within ±5m", () => {
    const now = Math.floor(Date.now() / 1000);
    const skew = 300;
    expect(withinClockSkew(now, now + 299, skew)).toBe(true);
    expect(withinClockSkew(now, now - 299, skew)).toBe(true);
    expect(withinClockSkew(now, now + 301, skew)).toBe(false);
  });

  it("identifies firebase ID token payloads when project id is configured", () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = "proj-test";
    const token = createJwt({
      iss: "https://securetoken.google.com/proj-test",
      aud: "proj-test",
      sub: "uid-123",
    });
    expect(isFirebaseIdTokenCandidate(token)).toBe(true);
  });

  it("rejects non-firebase tokens when project id is configured", () => {
    process.env.FIREBASE_ADMIN_PROJECT_ID = "proj-test";
    const token = createJwt({ iss: "https://cloud.google.com/iap", aud: "proj-test", sub: "uid-123" });
    expect(isFirebaseIdTokenCandidate(token)).toBe(false);
  });

  it("falls back to issuer heuristics without project id", () => {
    delete process.env.FIREBASE_ADMIN_PROJECT_ID;
    const firebaseToken = createJwt({
      iss: "https://securetoken.google.com/another-project",
      aud: "another-project",
      sub: "uid-456",
    });
    const serviceToken = "ya29.service-token";
    const iapToken = createJwt({ iss: "https://cloud.google.com/iap", aud: "client-id", sub: "user" });
    expect(isFirebaseIdTokenCandidate(firebaseToken)).toBe(true);
    expect(isFirebaseIdTokenCandidate(serviceToken)).toBe(false);
    expect(isFirebaseIdTokenCandidate(iapToken)).toBe(false);
  });
});


