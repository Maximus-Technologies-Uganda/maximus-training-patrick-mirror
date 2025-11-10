import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Mock the middleware functions
vi.mock("../../../../middleware/requestId", () => ({
  ensureRequestContext: vi.fn((_headers) => ({ requestId: "test-id" })),
  responseHeadersFromContext: vi.fn(() => ({ "x-request-id": "test-id" })),
}));

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: {},
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 when session cookie is invalid", async () => {
    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: {
        cookie: "session=invalid-token",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 when session token has no userId", async () => {
    // Create a valid JWT-like token without userId
    const payload = Buffer.from(JSON.stringify({ role: "admin" })).toString("base64");
    const token = `header.${payload.replace(/\+/g, "-").replace(/\//g, "_")}.signature`;

    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: {
        cookie: `session=${token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns user info when valid session token", async () => {
    // Create a valid JWT-like token with userId
    const payload = Buffer.from(JSON.stringify({ userId: "user-123", role: "admin" })).toString(
      "base64"
    );
    const token = `header.${payload.replace(/\+/g, "-").replace(/\//g, "_")}.signature`;

    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: {
        cookie: `session=${token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      userId: "user-123",
      role: "admin",
    });
  });

  it("returns default role 'owner' when role is missing", async () => {
    const payload = Buffer.from(JSON.stringify({ userId: "user-123" })).toString("base64");
    const token = `header.${payload.replace(/\+/g, "-").replace(/\//g, "_")}.signature`;

    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: {
        cookie: `session=${token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      userId: "user-123",
      role: "owner",
    });
  });

  it("handles multiple cookies correctly", async () => {
    const payload = Buffer.from(JSON.stringify({ userId: "user-123" })).toString("base64");
    const token = `header.${payload.replace(/\+/g, "-").replace(/\//g, "_")}.signature`;

    const request = new NextRequest("http://localhost/api/auth/me", {
      headers: {
        cookie: `other=value; session=${token}; another=cookie`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
