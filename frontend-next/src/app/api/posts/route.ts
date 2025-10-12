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
    const upstreamResponse = await fetchWithTimeoutAndRetries(
      upstreamUrl,
      {
        method: "GET",
        headers: buildAuthHeaders(),
        cache: "no-store",
      },
      5000,
      1,
    );

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const upstreamBodyText = await upstreamResponse.text();
    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(upstreamBodyText);
        // If the upstream returned an array (including empty array), pass it through as JSON
        if (Array.isArray(data)) {
          return NextResponse.json(data, { status: upstreamResponse.status });
        }
        // Fall through for non-array JSON payloads below to preserve content-type and body
      } catch {
        // Fall through to raw response if JSON parsing fails
      }
    }
    return new NextResponse(upstreamBodyText, {
      status: upstreamResponse.status,
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
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      body: bodyText,
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const upstreamBodyText = await upstreamResponse.text();
    const headers: Record<string, string> = {};
    const location = upstreamResponse.headers.get("Location");
    if (location) headers["Location"] = location;

    if (contentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(upstreamBodyText), {
          status: upstreamResponse.status,
          headers,
        });
      } catch {
        // Fall through to raw response if JSON parsing fails
      }
    }
    return new NextResponse(upstreamBodyText, {
      status: upstreamResponse.status,
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


