import { NextResponse, NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getIdToken } from "../../../../server/auth/getIdToken";

const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const API_SERVICE_TOKEN: string | undefined = process.env.API_SERVICE_TOKEN;
const IAP_AUDIENCE: string | undefined = process.env.IAP_AUDIENCE || process.env.ID_TOKEN_AUDIENCE;

export const runtime = "nodejs";

type LocalPost = {
  id: string;
  ownerId?: string;
  title: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

const localPostsFallback: Array<LocalPost> =
  (globalThis as unknown as { __LOCAL_POSTS__?: Array<LocalPost> }).__LOCAL_POSTS__ ?? [];

if (!(globalThis as unknown as { __LOCAL_POSTS__?: Array<LocalPost> }).__LOCAL_POSTS__) {
  (globalThis as unknown as { __LOCAL_POSTS__?: Array<LocalPost> }).__LOCAL_POSTS__ = localPostsFallback;
}

function extractForwardableCookies(cookieHeader: string): string {
  try {
    const cookies: string[] = [];
    const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
    if (sessionMatch) cookies.push(`session=${sessionMatch[1]}`);

    const csrfMatch = cookieHeader.match(/(?:^|;\s*)csrf=([^;]+)/);
    if (csrfMatch) {
      // Forward CSRF token with timestamp validation (T063)
      const csrfToken = csrfMatch[1];
      if (csrfToken.includes('-')) {
        const parts = csrfToken.split('-');
        if (parts.length === 2) {
          const timestamp = parseInt(parts[0], 10);
          const now = Math.floor(Date.now() / 1000);
          // Only forward tokens that are not too old (2 hours) or from the future (>5 minutes)
          if (!isNaN(timestamp) && timestamp <= now + 5 * 60 && now - timestamp <= 2 * 60 * 60) {
            cookies.push(`csrf=${csrfToken}`);
          }
        }
      } else {
        // Forward legacy tokens for backward compatibility
        cookies.push(`csrf=${csrfToken}`);
      }
    }
    return cookies.join("; ");
  } catch {
    return "";
  }
}

function extractUserIdentity(request: NextRequest): { userId?: string; role?: string } | null {
  // Extract from session cookie (matches API implementation)
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  try {
    // Simple JWT decode (matches API implementation)
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadSegment = parts[1];
    const json = Buffer.from(
      payloadSegment.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payloadSegment.length % 4)) % 4),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;

    const exp = typeof payload.exp === "number" ? payload.exp : NaN;
    if (!Number.isFinite(exp)) return null;

    const now = Math.floor(Date.now() / 1000);
    if (now >= exp) return null; // expired

    const userId = typeof payload.userId === "string" ? payload.userId : undefined;
    const role = typeof payload.role === "string" ? payload.role : "owner";

    return userId ? { userId, role } : null;
  } catch {
    return null;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (!IAP_AUDIENCE) return {};
  const token = await getIdToken(IAP_AUDIENCE);
  return { Authorization: `Bearer ${token}` };
}

function serviceAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!API_SERVICE_TOKEN) return headers;

  if (IAP_AUDIENCE) {
    headers["X-Service-Authorization"] = `Bearer ${API_SERVICE_TOKEN}`;
    return headers;
  }

  headers["Authorization"] = `Bearer ${API_SERVICE_TOKEN}`;
  return headers;
}

export async function DELETE(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1] || segments[segments.length - 2];
  const upstreamUrl = new URL(`/posts/${encodeURIComponent(id)}`, API_BASE_URL).toString();
  const incomingCookieHeader = request.headers.get("cookie") || "";
  const forwardCookieHeader = extractForwardableCookies(incomingCookieHeader);
  const originHeader = (request.headers.get("origin") || "").trim();
  const csrfHeader = (request.headers.get("x-csrf-token") || "").trim();
  if (!csrfHeader) {
    return NextResponse.json(
      { error: { code: "CSRF_HEADER_REQUIRED", message: "Missing X-CSRF-Token header" } },
      { status: 400 },
    );
  }
  const incomingReqId = request.headers.get("x-request-id") || "";
  const requestId = incomingReqId.trim() ? incomingReqId.trim() : randomUUID();

  // Extract and forward identity information (T053)
  const identity = extractUserIdentity(request);
  const identityHeaders: Record<string, string> = {};
  if (identity?.userId) {
    identityHeaders["X-User-Id"] = identity.userId;
  }
  if (identity?.role) {
    identityHeaders["X-User-Role"] = identity.role;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "DELETE",
      headers: {
        ...serviceAuthHeaders(),
        ...(await authHeader()),
        ...(forwardCookieHeader ? { Cookie: forwardCookieHeader } : {}),
        "X-Request-Id": requestId,
        ...(csrfHeader ? { "X-CSRF-Token": csrfHeader } : {}),
        ...(originHeader ? { Origin: originHeader } : {}),
        ...identityHeaders,
      },
    });
    const upstreamRequestId = upstream.headers.get("x-request-id") || requestId;
    return new NextResponse(null, { status: upstream.status, headers: { "X-Request-Id": upstreamRequestId } });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const index = localPostsFallback.findIndex((post) => post.id === id);
      if (index >= 0) {
        localPostsFallback.splice(index, 1);
      }
      return new NextResponse(null, {
        status: 204,
        headers: { "X-Request-Id": requestId, "X-Fallback": "local" },
      });
    }

    const errInfo =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error);
    console.error(
      JSON.stringify({
        level: "error",
        msg: "DELETE /api/posts/:id upstream error",
        upstreamUrl,
        requestId,
        error: errInfo,
      }),
    );
    return NextResponse.json(
      { error: { code: "UPSTREAM_DELETE_FAILED", message: "Failed to delete post" } },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1] || segments[segments.length - 2];
  const upstreamUrl = new URL(`/posts/${encodeURIComponent(id)}`, API_BASE_URL).toString();
  let body = "";
  try {
    body = await request.text();
  } catch {
    body = "";
  }
  const incomingCookieHeader = request.headers.get("cookie") || "";
  const forwardCookieHeader = extractForwardableCookies(incomingCookieHeader);
  const originHeader = (request.headers.get("origin") || "").trim();
  const csrfHeader = (request.headers.get("x-csrf-token") || "").trim();
  if (!csrfHeader) {
    return NextResponse.json(
      { error: { code: "CSRF_HEADER_REQUIRED", message: "Missing X-CSRF-Token header" } },
      { status: 400 },
    );
  }
  const incomingReqId = request.headers.get("x-request-id") || "";
  const requestId = incomingReqId.trim() ? incomingReqId.trim() : randomUUID();

  // Extract and forward identity information (T053)
  const identity = extractUserIdentity(request);
  const identityHeaders: Record<string, string> = {};
  if (identity?.userId) {
    identityHeaders["X-User-Id"] = identity.userId;
  }
  if (identity?.role) {
    identityHeaders["X-User-Role"] = identity.role;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...serviceAuthHeaders(),
        ...(await authHeader()),
        ...(forwardCookieHeader ? { Cookie: forwardCookieHeader } : {}),
        "X-Request-Id": requestId,
        ...(csrfHeader ? { "X-CSRF-Token": csrfHeader } : {}),
        ...(originHeader ? { Origin: originHeader } : {}),
        ...identityHeaders,
      },
      body,
    });
    const upstreamBody = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "";
    const upstreamRequestId = upstream.headers.get("x-request-id") || requestId;
    if (contentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(upstreamBody), {
          status: upstream.status,
          headers: { "X-Request-Id": upstreamRequestId },
        });
      } catch {
        // fall through
      }
    }
    return new NextResponse(upstreamBody, {
      status: upstream.status,
      headers: { "content-type": contentType || "text/plain", "X-Request-Id": upstreamRequestId },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      let partial: Partial<LocalPost> = {};
      try {
        partial = body ? (JSON.parse(body) as Partial<LocalPost>) : {};
      } catch {
        partial = {};
      }
      const now = new Date().toISOString();
      let existing = localPostsFallback.find((post) => post.id === id);
      if (!existing) {
        existing = {
          id,
          ownerId: undefined,
          title: "",
          content: "",
          tags: [],
          published: true,
          createdAt: now,
          updatedAt: now,
        };
        localPostsFallback.unshift(existing);
      }
      if (typeof partial.title === "string") existing.title = partial.title;
      if (typeof partial.content === "string") existing.content = partial.content;
      if (typeof partial.ownerId === "string") existing.ownerId = partial.ownerId;
      if (Array.isArray(partial.tags)) {
        existing.tags = partial.tags.filter((tag): tag is string => typeof tag === "string");
      }
      if (typeof partial.published === "boolean") existing.published = partial.published;
      existing.updatedAt = now;
      return NextResponse.json(existing, {
        status: 200,
        headers: { "X-Request-Id": requestId, "X-Fallback": "local" },
      });
    }

    const errInfo =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error);
    console.error(
      JSON.stringify({
        level: "error",
        msg: "PATCH /api/posts/:id upstream error",
        upstreamUrl,
        requestId,
        error: errInfo,
      }),
    );
    return NextResponse.json(
      { error: { code: "UPSTREAM_UPDATE_FAILED", message: "Failed to update post" } },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}


