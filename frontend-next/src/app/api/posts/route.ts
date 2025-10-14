import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

// Prefer a server-only base URL for backend calls; never expose secrets to the client
// Fallback to NEXT_PUBLIC_API_URL so server and client target the same host in local dev
// Default to http://localhost:8080 to avoid self-referential loops to the Next dev server (3000)
const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const API_SERVICE_TOKEN: string | undefined = process.env.API_SERVICE_TOKEN;

// Local in-process fallback store for CI/local when upstream API is unavailable
// Use globalThis to better survive module reloads in dev
const localPostsFallback: Array<{
  id: string;
  ownerId?: string;
  title: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}> = (globalThis as unknown as { __LOCAL_POSTS__?: Array<any> }).__LOCAL_POSTS__ ?? [];
// Initialize global store if missing
if (!(globalThis as unknown as { __LOCAL_POSTS__?: Array<any> }).__LOCAL_POSTS__) {
  (globalThis as unknown as { __LOCAL_POSTS__?: Array<any> }).__LOCAL_POSTS__ = localPostsFallback;
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_SERVICE_TOKEN) headers["Authorization"] = `Bearer ${API_SERVICE_TOKEN}`;
  return headers;
}

function buildUpstreamUrl(pathname: string, search: URLSearchParams): string {
  const url = new URL(pathname, API_BASE_URL);
  // Copy across query params (e.g., page, pageSize)
  for (const [key, value] of search.entries()) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function createAbortController(timeoutMs: number): { controller: AbortController; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const clear = (): void => clearTimeout(timer);
  return { controller, clear };
}

async function fetchWithTimeoutAndRetries(
  url: string,
  init: RequestInit,
  timeoutMs: number = 5000,
  retries: number = 1,
): Promise<Response> {
  let lastError: unknown = undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { controller, clear } = createAbortController(timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clear();
      // Retry on 5xx only; surface others immediately
      if (res.status >= 500 && attempt < retries) {
        continue;
      }
      return res;
    } catch (error) {
      clear();
      lastError = error;
      if (attempt >= retries) break;
    }
  }
  throw lastError ?? new Error("Request failed");
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = buildUpstreamUrl("/posts", request.nextUrl.searchParams);
  try {
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId : randomUUID();
    const upstreamResponse = await fetchWithTimeoutAndRetries(
      upstreamUrl,
      {
        method: "GET",
        headers: {
          ...buildAuthHeaders(),
          "X-Request-Id": requestId,
        },
        cache: "no-store",
      },
      5000,
      1,
    );

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const upstreamRequestId = upstreamResponse.headers.get("x-request-id") || requestId;
    const upstreamBodyText = await upstreamResponse.text();
    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(upstreamBodyText);
        // If the upstream returned an array (including empty array), pass it through as JSON
        if (Array.isArray(data)) {
          return NextResponse.json(data, {
            status: upstreamResponse.status,
            headers: { "X-Request-Id": upstreamRequestId },
          });
        }
        // Fall through for non-array JSON payloads below to preserve content-type and body
      } catch {
        // Fall through to raw response if JSON parsing fails
      }
    }
    return new NextResponse(upstreamBodyText, {
      status: upstreamResponse.status,
      headers: { "content-type": contentType || "text/plain", "X-Request-Id": upstreamRequestId },
    });
  } catch (error) {
    // Fallback for local/CI: return an empty list to keep UI flows working
    if (process.env.NODE_ENV !== "production") {
      const search = request.nextUrl.searchParams;
      const page = Number(search.get("page") ?? "1") || 1;
      const pageSize = Number(search.get("pageSize") ?? "10") || 10;
      const start = (page - 1) * pageSize;
      const items = localPostsFallback
        .slice()
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(start, start + pageSize);
      const total = localPostsFallback.length;
      const hasNextPage = start + items.length < total;
      const incomingReqId = request.headers.get("x-request-id") || "";
      const requestId = incomingReqId.trim() ? incomingReqId : randomUUID();
      return NextResponse.json({ page, pageSize, hasNextPage, items }, {
        status: 200,
        headers: { "X-Request-Id": requestId },
      });
    }
    console.error("GET /api/posts upstream error", { upstreamUrl, error });
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId : randomUUID();
    return NextResponse.json(
      { error: { code: "UPSTREAM_FETCH_FAILED", message: "Failed to fetch posts" } },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = new URL("/posts", API_BASE_URL).toString();
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    bodyText = "{}";
  }
  try {
    const incomingCookieHeader = request.headers.get("cookie") || "";
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId : randomUUID();
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(),
        ...(incomingCookieHeader ? { Cookie: incomingCookieHeader } : {}),
        "X-Request-Id": requestId,
      },
      body: bodyText,
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const upstreamBodyText = await upstreamResponse.text();
    const headers: Record<string, string> = {};
    const location = upstreamResponse.headers.get("Location");
    if (location) headers["Location"] = location;
    const upstreamRequestId = upstreamResponse.headers.get("x-request-id") || requestId;

    if (contentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(upstreamBodyText), {
          status: upstreamResponse.status,
          headers: { ...headers, "X-Request-Id": upstreamRequestId },
        });
      } catch {
        // Fall through to raw response if JSON parsing fails
      }
    }
    return new NextResponse(upstreamBodyText, {
      status: upstreamResponse.status,
      headers: { ...headers, "content-type": contentType || "text/plain", "X-Request-Id": upstreamRequestId },
    });
  } catch (error) {
    // Fallback for local/CI: accept creation and return a fabricated record
    if (process.env.NODE_ENV !== "production") {
      try {
        const parsed = JSON.parse(bodyText || "{}") as { title?: string; content?: string };
        // Derive userId from incoming cookie if present (decode unsigned dev token)
        const cookieHeader = request.headers.get("cookie") || "";
        let ownerId: string | undefined = undefined;
        try {
          const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
          const token = match?.[1] ?? "";
          const parts = token.split(".");
          if (parts.length === 3) {
            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
            const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
            if (typeof payload.userId === "string") ownerId = payload.userId;
          }
        } catch {
          // ignore decode errors; leave ownerId undefined
        }
        const now = new Date().toISOString();
        const created = {
          id: "local-" + Math.random().toString(36).slice(2),
          ownerId,
          title: parsed.title ?? "",
          content: parsed.content ?? "",
          tags: [],
          published: true,
          createdAt: now,
          updatedAt: now,
        };
        // Store for subsequent GET fallback reads
        localPostsFallback.unshift(created);
        const incomingReqId = request.headers.get("x-request-id") || "";
        const requestId = incomingReqId.trim() ? incomingReqId : randomUUID();
        return NextResponse.json(created, { status: 201, headers: { "X-Request-Id": requestId } });
      } catch {
        // noop and fall through
      }
    }
    console.error("POST /api/posts upstream error", { upstreamUrl, error });
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId : randomUUID();
    return NextResponse.json(
      { error: { code: "UPSTREAM_CREATE_FAILED", message: "Failed to create post" } },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}


