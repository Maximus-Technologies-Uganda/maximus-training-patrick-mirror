import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function makeRequest(body: object, extraHeaders: Record<string, string> = {}): NextRequest {
  const req = new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  // @ts-ignore: NextResponse expects a framework-internal NextRequest; minimal Request is sufficient for handler
  return req as unknown as NextRequest;
}

describe("POST /api/auth/login route handler (fallback)", () => {
  it("returns 204 and sets cookie on valid local creds", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    const res = await POST(makeRequest({ username: "admin", password: "password" }));
    // @ts-ignore: Accessing NextResponse internals for assertion in test
    expect(res.status).toBe(204);
    // @ts-ignore: Accessing NextResponse internals for assertion in test
    expect(res.headers.get("set-cookie")).toBeTruthy();
  });

  it("sets Secure on cookie when request is HTTPS", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("upstream down"));
    const req = makeRequest(
      { username: "admin", password: "password" },
      { "x-forwarded-proto": "https" },
    );
    const res = await POST(req);
    // @ts-ignore
    const setCookie = res.headers.get("set-cookie") || "";
    expect(setCookie).toMatch(/;\s*Secure/);
  });
});
