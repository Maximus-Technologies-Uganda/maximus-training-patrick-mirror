import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";

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

const mockFetch = vi.fn();
const fixedNow = new Date("2025-01-15T12:00:00Z");
let dateNowSpy: ReturnType<typeof vi.spyOn> | undefined;

beforeAll(() => {
  dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(fixedNow.getTime());
});

afterAll(() => {
  dateNowSpy?.mockRestore();
});

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

function makeCsrfToken(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomUUID().split("-")[0];
  return `${timestamp}-${nonce}`;
}

function makeRequest(
  options: {
    url?: string;
    cookies?: string;
    csrf?: string;
    origin?: string;
    body?: string;
  } = {}
): NextRequest {
  const headers = new Headers();
  if (options.cookies) headers.set("cookie", options.cookies);
  if (options.csrf) headers.set("x-csrf-token", options.csrf);
  if (options.origin) headers.set("origin", options.origin);
  const text = vi.fn().mockResolvedValue(options.body ?? "");
  return {
    headers,
    url: options.url ?? "http://localhost:3000/api/posts/abc",
    text,
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.resetModules();
  mockFetch.mockReset();
  (global as typeof globalThis & { fetch: typeof fetch }).fetch =
    mockFetch as unknown as typeof fetch;
  mockFetch.mockResolvedValue({
    status: 204,
    headers: new Headers(),
    text: vi.fn().mockResolvedValue(""),
  } as unknown as Response);
});

describe("/api/posts/[id] route handlers", () => {
  it("forwards identity, csrf, and cookies on DELETE", async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const csrf = makeCsrfToken();
    const token = makeJwt({ userId: "user-123", role: "admin", exp: nowSeconds + 60 });
    const req = makeRequest({
      cookies: `session=${token}; foo=bar; csrf=${csrf}; csrflite=old`,
      csrf,
      origin: "https://app.local",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(req);
    expect(res.status).toBe(204);
    const [, init] = mockFetch.mock.calls[0];
    expect(init?.method).toBe("DELETE");
    expect(init?.headers).toMatchObject({
      Cookie: `session=${token}; csrf=${csrf}`,
      "X-CSRF-Token": csrf,
      "X-User-Id": "user-123",
      "X-User-Role": "admin",
      Origin: "https://app.local",
    });
  });

  it("rejects DELETE without csrf header", async () => {
    const req = makeRequest({ cookies: "session=abc.def" });
    const { DELETE } = await import("./route");
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({
      error: { code: "CSRF_HEADER_REQUIRED", message: "Missing X-CSRF-Token header" },
    });
  });

  it("falls back to local update when upstream PATCH fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"));
    const body = JSON.stringify({ title: "Updated", tags: ["vitest"] });
    const csrf = makeCsrfToken();
    const req = makeRequest({ body, csrf });
    const { PATCH } = await import("./route");
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Fallback")).toBe("local");
    const json = await res.json();
    expect(json.title).toBe("Updated");
    expect(json.tags).toEqual(["vitest"]);
  });
});
