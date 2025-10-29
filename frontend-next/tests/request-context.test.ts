import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  ensureRequestContext,
  buildPropagationHeaders,
  mergeUpstreamContext,
  responseHeadersFromContext,
} from "../src/middleware/requestId";
import { POST as loginPost } from "../src/app/api/auth/login/route";

function createHeaders(init?: Record<string, string>): Headers {
  const headers = new Headers();
  if (init) {
    for (const [key, value] of Object.entries(init)) {
      headers.set(key, value);
    }
  }
  return headers;
}

describe("request context helper", () => {
  it("generates identifiers when headers are absent", () => {
    const context = ensureRequestContext(createHeaders());
    expect(context.requestId).toMatch(/[0-9a-f-]{36}/i);
    expect(context.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/i);
    const headers = buildPropagationHeaders(context);
    expect(headers["X-Request-Id"]).toBe(context.requestId);
    expect(headers.traceparent).toBe(context.traceparent);
  });

  it("preserves upstream identifiers when present", () => {
    const requestHeaders = createHeaders({
      "x-request-id": "client-req-123",
      traceparent: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
      tracestate: "foo=1",
    });
    const context = ensureRequestContext(requestHeaders);
    expect(context.requestId).toBe("client-req-123");
    expect(context.traceId).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const upstreamHeaders = createHeaders({
      "x-request-id": "api-req-456",
      traceparent: "00-cccccccccccccccccccccccccccccccc-dddddddddddddddd-01",
    });
    const merged = mergeUpstreamContext(context, upstreamHeaders);
    expect(merged.requestId).toBe("api-req-456");
    expect(merged.traceId).toBe("cccccccccccccccccccccccccccccccc");
    expect(responseHeadersFromContext(merged).traceparent).toBe(
      "00-cccccccccccccccccccccccccccccccc-dddddddddddddddd-01"
    );
  });
});

describe("auth login route correlation", () => {
  const originalApiBaseUrl = process.env.API_BASE_URL;
  const originalIapAudience = process.env.IAP_AUDIENCE;
  const originalIdTokenAudience = process.env.ID_TOKEN_AUDIENCE;

  class MockNextRequest {
    headers: Headers;
    private body: string;
    nextUrl: { protocol: string };

    constructor(body: string, headersInit: Record<string, string>) {
      this.headers = new Headers(headersInit);
      this.body = body;
      this.nextUrl = { protocol: "https:" };
    }

    async text(): Promise<string> {
      return this.body;
    }
  }

  beforeEach(() => {
    process.env.API_BASE_URL = "https://api.example.test";
    delete process.env.IAP_AUDIENCE;
    delete process.env.ID_TOKEN_AUDIENCE;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalApiBaseUrl) {
      process.env.API_BASE_URL = originalApiBaseUrl;
    } else {
      delete process.env.API_BASE_URL;
    }
    if (originalIapAudience) {
      process.env.IAP_AUDIENCE = originalIapAudience;
    } else {
      delete process.env.IAP_AUDIENCE;
    }
    if (originalIdTokenAudience) {
      process.env.ID_TOKEN_AUDIENCE = originalIdTokenAudience;
    } else {
      delete process.env.ID_TOKEN_AUDIENCE;
    }
  });

  it("forwards and merges correlation headers across BFF and API", async () => {
    const clientHeaders = {
      "x-request-id": "client-req-123",
      traceparent: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
      tracestate: "foo=1",
    };
    const upstreamHeaders = new Headers({
      "x-request-id": "api-req-456",
      traceparent: "00-cccccccccccccccccccccccccccccccc-dddddddddddddddd-01",
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204, headers: upstreamHeaders }));

    const request = new MockNextRequest(
      JSON.stringify({ username: "admin", password: "password" }),
      clientHeaders
    );

    const response = await loginPost(request as unknown as NextRequest);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, fetchOptions] = fetchMock.mock.calls[0];
    expect(fetchOptions).toBeTruthy();
    const propagatedHeaders = (fetchOptions as RequestInit).headers as Record<string, string>;
    expect(propagatedHeaders["X-Request-Id"]).toBe("client-req-123");
    expect(propagatedHeaders.traceparent).toBe(
      "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01"
    );

    expect(response.headers.get("x-request-id")).toBe("api-req-456");
    expect(response.headers.get("traceparent")).toBe(
      "00-cccccccccccccccccccccccccccccccc-dddddddddddddddd-01"
    );
  });
});
