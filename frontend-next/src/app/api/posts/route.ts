import { NextRequest, NextResponse } from "next/server";

// Prefer a server-only base URL for backend calls; never expose secrets to the client
// Use 8080 as a safe local fallback to avoid self-calls to the Next server on 3000
const API_BASE_URL: string = process.env.API_BASE_URL ?? "http://localhost:8080";
const API_SERVICE_TOKEN: string | undefined = process.env.API_SERVICE_TOKEN;

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_SERVICE_TOKEN) headers["Authorization"] = `Bearer ${API_SERVICE_TOKEN}`;
  return headers;
}

function buildBackendUrl(pathname: string, search: URLSearchParams): string {
  const url = new URL(pathname, API_BASE_URL);
  // Copy across query params (e.g., page, pageSize)
  for (const [key, value] of search.entries()) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function fetchWithTimeoutAndRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number = 5000,
  retries: number = 1,
): Promise<Response> {
  let lastError: unknown = undefined;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      // Retry on 5xx only; surface others immediately
      if (res.status >= 500 && attempt < retries) {
        continue;
      }
      return res;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt >= retries) break;
    }
  }
  throw lastError ?? new Error("Request failed");
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = buildBackendUrl("/posts", request.nextUrl.searchParams);
  try {
    const res = await fetchWithTimeoutAndRetry(
      upstreamUrl,
      {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
      },
      5000,
      1,
    );

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(text);
        // If the upstream returned an array (including empty array), pass it through as JSON
        if (Array.isArray(data)) {
          return NextResponse.json(data, { status: res.status });
        }
        // Fall through for non-array JSON payloads below to preserve content-type and body
      } catch {
        // Fall through to raw response if JSON parsing fails
      }
    }
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": contentType || "text/plain" },
    });
  } catch (error) {
    // Log the error for server-side observability without leaking sensitive details to clients
    console.error("GET /api/posts upstream error", { upstreamUrl, error });
    return NextResponse.json(
      { error: { code: "UPSTREAM_FETCH_FAILED", message: "Failed to fetch posts" } },
      { status: 500 },
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
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: bodyText,
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    const headers: Record<string, string> = {};
    const location = res.headers.get("Location");
    if (location) headers["Location"] = location;

    if (contentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(text), {
          status: res.status,
          headers,
        });
      } catch {
        // Fall through to raw response if JSON parsing fails
      }
    }
    return new NextResponse(text, {
      status: res.status,
      headers: { ...headers, "content-type": contentType || "text/plain" },
    });
  } catch (error) {
    // Log the error for server-side observability without leaking sensitive details to clients
    console.error("POST /api/posts upstream error", { upstreamUrl, error });
    return NextResponse.json(
      { error: { code: "UPSTREAM_CREATE_FAILED", message: "Failed to create post" } },
      { status: 500 },
    );
  }
}


