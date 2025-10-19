import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/auth/logout route handler (fallback)", () => {
  it("returns 204 and clears cookie in fallback", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    // @ts-ignore: Minimal NextRequest shape sufficient for handler under test
    const req = { headers: new Map() } as unknown as NextRequest;
    const res = await POST(req);
    // @ts-ignore: Accessing NextResponse internals for assertion in test
    expect(res.status).toBe(204);
    // @ts-ignore: Accessing NextResponse internals for assertion in test
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
  });

  it("sets Secure on cleared cookie when request is HTTPS", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    const req = { headers: new Map([["x-forwarded-proto", "https"]]) } as unknown as NextRequest;
    const res = await POST(req);
    // @ts-ignore
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toMatch(/;\s*Secure/);
  });
});
