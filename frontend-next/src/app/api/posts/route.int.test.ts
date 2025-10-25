import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
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
// Avoid importing next/server in Vitest environment

// Minimal polyfill for fetch used by route handler
const mockJson = vi.fn();
const mockText = vi.fn();

// Replace global fetch for this test file
beforeEach(() => {
  mockJson.mockReset();
  mockText.mockReset();
  // Default: return 200 with JSON array
  global.fetch = vi.fn(async () => {
    return {
      status: 200,
      headers: new Map([["content-type", "application/json"]]),
      json: mockJson.mockResolvedValue([{ id: "p1", title: "Hello" }]),
      text: mockText.mockResolvedValue(JSON.stringify([{ id: "p1", title: "Hello" }])),
    } as unknown as Response;
  }) as unknown as typeof fetch;
});

import { GET } from "./route";

function makeRequest(url: string): NextRequest {
  // Minimal NextRequest-like shape sufficient for handler under test
  return {
    headers: new Map(),
    nextUrl: new URL(url, "http://localhost:3000"),
  } as unknown as NextRequest;
}

describe("GET /api/posts route handler", () => {
  it("proxies JSON arrays from upstream as JSON", async () => {
    const req = makeRequest("/api/posts?page=1&pageSize=5");
    const res = await GET(req);
    // Accessing NextResponse internals for assertion in test
    expect(res.status).toBe(200);
    // Accessing NextResponse internals for assertion in test
    expect(res.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("falls back to local list JSON on error in non-production", async () => {
    (global.fetch as unknown as Mock).mockImplementationOnce(async () => {
      throw new Error("upstream down");
    });
    const req = makeRequest("/api/posts?page=1&pageSize=1");
    const res = await GET(req);
    // Accessing NextResponse internals for assertion in test
    expect(res.status).toBe(200);
  });

  it("passes through non-array JSON body as text with content-type preserved", async () => {
    (global.fetch as unknown as Mock).mockImplementationOnce(async () => {
      return {
        status: 200,
        headers: new Map([["content-type", "application/json; charset=utf-8"]]),
        json: vi.fn().mockResolvedValue({ ok: true }),
        text: vi.fn().mockResolvedValue("{\"ok\":true}"),
      } as unknown as Response;
    });
    const req = makeRequest("/api/posts?page=1&pageSize=1");
    const res = await GET(req);
    // Accessing NextResponse internals for assertion in test
    expect(res.status).toBe(200);
    // Accessing NextResponse internals for assertion in test
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("forwards only session and csrf cookies on POST", async () => {
    // Arrange a fake upstream that echoes cookies back
    (global.fetch as unknown as Mock).mockImplementationOnce(async (_url, _init) => {
      return {
        status: 201,
        headers: new Map([["content-type", "application/json"]]),
        json: vi.fn().mockResolvedValue({ ok: true }),
        text: vi.fn().mockResolvedValue("{\"ok\":true}"),
      } as unknown as Response;
    });
    const req = {
      headers: new Map([
        ["cookie", "foo=bar; session=abc.def.dev; csrf=csrf-cookie; other=baz"],
        ["x-csrf-token", "csrf-header"],
      ]),
      nextUrl: new URL("http://localhost:3000/api/posts"),
      text: vi.fn().mockResolvedValue("{\"title\":\"T\"}"),
    } as unknown as NextRequest;
    const { POST } = await import("./route");
    const res = await POST(req);
    expect(res.status).toBe(201);
    const fetchArgs = (global.fetch as unknown as Mock).mock.calls[0];
    expect(fetchArgs?.[1]?.headers).toMatchObject({ Cookie: "session=abc.def.dev; csrf=csrf-cookie" });
  });

  it("rejects POST without X-CSRF-Token header", async () => {
    const req = {
      headers: new Map([["cookie", "session=abc.def.dev"]]),
      nextUrl: new URL("http://localhost:3000/api/posts"),
      text: vi.fn().mockResolvedValue("{\"title\":\"T\"}"),
    } as unknown as NextRequest;
    const { POST } = await import("./route");
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: { code: "CSRF_HEADER_REQUIRED", message: "Missing X-CSRF-Token header" },
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});


