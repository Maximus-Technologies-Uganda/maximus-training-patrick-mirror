import { NextResponse, type NextRequest } from "next/server";
import { getIdToken } from "@/server/auth/getIdToken";
import {
  ensureRequestContext,
  buildPropagationHeaders,
  type RequestContext,
} from "@/middleware/requestId";

/**
 * T049 & T050: /status Route Handler
 *
 * Implements public health endpoint with:
 * - Health indicators (ok: boolean)
 * - Upstream status (API availability)
 * - Trace ID correlation (FR-013)
 * - Latency logging (FR-020)
 * - No-store cache control (FR-026)
 * - Sensitive field exclusion (FR-024)
 * - Uses same server-side ID token flow as /posts SSR (FR-021, FR-025)
 *
 * Route: GET /status
 * Returns: { ok: boolean, traceId: string, ts: string, reason?: string, upstream?: {...} }
 * Headers: Cache-Control: no-store, X-Robots-Tag: noindex
 */

// Prefer server-only base URL for backend calls; never expose to client
// Fallback to NEXT_PUBLIC_API_URL so server and client target same host in dev
const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Use logical-OR so empty IAP_AUDIENCE falls back to ID_TOKEN_AUDIENCE (FR-025)
const IAP_AUDIENCE: string | undefined = process.env.IAP_AUDIENCE || process.env.ID_TOKEN_AUDIENCE;

interface UpstreamStatus {
  ok: boolean;
  latency_ms: number;
  status?: number;
}

interface StatusResponse {
  ok: boolean;
  traceId: string;
  ts: string;
  reason?: string;
  upstream?: UpstreamStatus;
}

// Ensure Node.js runtime so google-auth-library can mint ID tokens on Cloud Run
export const runtime = "nodejs";

/**
 * Build authorization headers using ID token client
 * Matches pattern from /api/posts route handler
 */
async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (IAP_AUDIENCE) {
    const idToken = await getIdToken(IAP_AUDIENCE);
    headers["Authorization"] = `Bearer ${idToken}`;
    return headers;
  }

  return headers;
}

/**
 * Create abort controller with timeout
 */
function createAbortController(timeoutMs: number): {
  controller: AbortController;
  clear: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const clear = (): void => clearTimeout(timer);
  return { controller, clear };
}

/**
 * Check upstream API health
 * Uses same server-side ID token flow as /posts SSR (FR-002, FR-021)
 * Calls upstream /posts endpoint with limit=1 to validate availability
 */
async function checkUpstreamHealth(
  context: RequestContext,
  propagationHeaders: Record<string, string>
): Promise<{ status: UpstreamStatus; reason?: string }> {
  const startTime = Date.now();

  try {
    // Validate audience == API_BASE_URL per FR-025
    if (IAP_AUDIENCE && IAP_AUDIENCE !== API_BASE_URL) {
      return {
        status: {
          ok: false,
          latency_ms: Date.now() - startTime,
          status: 500,
        },
        reason: "Configuration error: ID_TOKEN_AUDIENCE does not match API_BASE_URL",
      };
    }

    // Call upstream /posts?limit=1 to validate API health
    const healthUrl = new URL("/posts?limit=1", API_BASE_URL).toString();
    const { controller, clear } = createAbortController(800); // Per-attempt timeout ≤800ms (FR-015)

    try {
      const upstreamResponse = await fetch(healthUrl, {
        method: "GET",
        headers: {
          ...(await buildAuthHeaders()),
          ...propagationHeaders,
        },
        signal: controller.signal,
        cache: "no-store",
      });

      clear();
      const latency = Date.now() - startTime;

      if (upstreamResponse.ok) {
        return {
          status: {
            ok: true,
            latency_ms: latency,
            status: 200,
          },
        };
      }

      // Upstream returned error status
      return {
        status: {
          ok: false,
          latency_ms: latency,
          status: upstreamResponse.status,
        },
        reason: `Upstream returned ${upstreamResponse.status}`,
      };
    } catch (error) {
      clear();
      const latency = Date.now() - startTime;

      // Distinguish between timeout and other errors
      if (error instanceof Error && error.name === "AbortError") {
        return {
          status: {
            ok: false,
            latency_ms: latency,
            status: 504,
          },
          reason: "Upstream timeout",
        };
      }

      return {
        status: {
          ok: false,
          latency_ms: latency,
          status: 503,
        },
        reason: "Upstream service unavailable",
      };
    }
  } catch (_error) {
    const latency = Date.now() - startTime;

    return {
      status: {
        ok: false,
        latency_ms: latency,
        status: 503,
      },
      reason: "Health check failed",
    };
  }
}

/**
 * Main handler
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const context = ensureRequestContext(request.headers);
  const propagationHeaders = buildPropagationHeaders(context);

  try {
    // Check upstream health using same token flow as SSR
    const { status: upstreamStatus, reason: upstreamReason } = await checkUpstreamHealth(
      context,
      propagationHeaders
    );

    // Build response per FR-021 contract
    const response: StatusResponse = {
      ok: upstreamStatus.ok,
      traceId: context.traceId,
      ts: new Date().toISOString(),
      upstream: upstreamStatus,
    };

    if (!upstreamStatus.ok) {
      response.reason = upstreamReason || "Upstream service unavailable";
    }

    const latency_ms = Date.now() - startTime;

    // Log context per FR-020 (all requests, not just failures)
    const logEntry = {
      trace: context.traceId,
      route: "/status",
      latency_ms,
      status: 200,
      upstream_status: upstreamStatus.status,
      ok: response.ok,
    };

    // 100% sampling for failures per FR-028; standard rate for successes
    if (!response.ok) {
      console.log("[STATUS_HEALTH_FAILURE]", JSON.stringify(logEntry));
    } else {
      // Log successes at standard rate per FR-020
      console.log("[STATUS_HEALTH_OK]", JSON.stringify(logEntry));
    }

    // Return response with cache-control: no-store per FR-026
    const nextResponse = NextResponse.json(response, { status: 200 });

    // Set required headers per FR-026, FR-013
    nextResponse.headers.set("Cache-Control", "no-store");
    nextResponse.headers.set("X-Robots-Tag", "noindex");
    nextResponse.headers.set("Content-Type", "application/json");
    nextResponse.headers.set("x-trace-id", context.traceId);

    return nextResponse;
  } catch (error) {
    const latency_ms = Date.now() - startTime;
    const context = ensureRequestContext(request.headers);

    // Sanitize error message to avoid exposing internal details (per review)
    let reason = "Internal server error";
    if (error instanceof Error) {
      // Only expose generic message; log full details separately
      console.error(
        "[STATUS_EXCEPTION]",
        JSON.stringify({
          trace: context.traceId,
          route: "/status",
          error_name: error.name,
          error_message: error.message,
          latency_ms,
        })
      );
    }

    const errorResponse: StatusResponse = {
      ok: false,
      traceId: context.traceId,
      ts: new Date().toISOString(),
      reason,
      upstream: {
        ok: false,
        latency_ms,
      },
    };

    // Always log errors per FR-028 (100% sampling for failures)
    console.error(
      "[STATUS_ERROR]",
      JSON.stringify({
        trace: context.traceId,
        route: "/status",
        latency_ms,
        status: 200,
        upstream_status: undefined,
        ok: false,
      })
    );

    const nextResponse = NextResponse.json(errorResponse, { status: 200 });
    nextResponse.headers.set("Cache-Control", "no-store");
    nextResponse.headers.set("X-Robots-Tag", "noindex");
    nextResponse.headers.set("x-trace-id", context.traceId);

    return nextResponse;
  }
}

// Explicitly set this route to be dynamic per FR-068
export const dynamic = "force-dynamic";
export const revalidate = 0;
