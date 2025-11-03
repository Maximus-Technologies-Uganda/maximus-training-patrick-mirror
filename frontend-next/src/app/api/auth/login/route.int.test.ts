import { describe, it, expect, vi } from "vitest";
import type { NextRequest } from "next/server";
vi.mock("next/server", () => {
  class NextResponse extends Response {
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      super(body ?? null, init);
    }
    static json(data: unknown, init?: ResponseInit) {
      const headers = new Headers(init?.headers as HeadersInit);
      if (!headers.has("content-type")) headers.set("content-type", "application/json");
      return new NextResponse(JSON.stringify(data), { ...init, headers });
    }
  }
  const NextRequest = class {};
  return { NextResponse, NextRequest };
});
import { POST } from "./route";

type FakeNextRequest = {
  headers: Map<string, string>;
  text?: () => Promise<string>;
};

function makeRequest(body: object, extraHeaders: Record<string, string> = {}): FakeNextRequest {
  const headers = new Map<string, string>(
    Object.entries({ "Content-Type": "application/json", ...extraHeaders })
  );
  return {
    headers,
    text: async () => JSON.stringify(body),
  } as FakeNextRequest;
}

describe("POST /api/auth/login route handler (fallback)", () => {
  it("returns 204 and sets cookie with 1-hour TTL on valid local creds", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    const res = await POST(
      makeRequest({ username: "admin", password: "password" }) as unknown as NextRequest
    );
    expect(res.status).toBe(204);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("Max-Age=3600");
  });

  it("sets Secure on cookie when request is HTTPS", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    const req = makeRequest(
      { username: "admin", password: "password" },
      { "x-forwarded-proto": "https" }
    );
    const res = await POST(req as unknown as NextRequest);
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toMatch(/;\s*Secure/);
  });
});
