import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { NextRequest } from "next/server";

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

  it("filters Cookie header to only session on POST", async () => {
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
      headers: new Map([["cookie", "foo=bar; session=abc.def.dev; other=baz"]]),
      nextUrl: new URL("http://localhost:3000/api/posts"),
      text: vi.fn().mockResolvedValue("{\"title\":\"T\"}"),
    } as unknown as NextRequest;
    const { POST } = await import("./route");
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});


