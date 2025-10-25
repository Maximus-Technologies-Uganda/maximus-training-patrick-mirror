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

type FakeReq = { headers: Map<string, string> };

describe("POST /api/auth/logout route handler (fallback)", () => {
  it("returns 204 and clears cookie in fallback", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    const req = { headers: new Map() } as unknown as FakeReq;
    const res = await POST(req as unknown as NextRequest);
    expect(res.status).toBe(204);
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toMatch(/Max-Age=0/);
  });

  it("sets Secure on cleared cookie when request is HTTPS", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    const req = { headers: new Map([["x-forwarded-proto", "https"]]) } as unknown as FakeReq;
    const res = await POST(req as unknown as NextRequest);
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toMatch(/;\s*Secure/);
  });
});
