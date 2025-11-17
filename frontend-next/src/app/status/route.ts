import { NextRequest, NextResponse } from "next/server";

import { buildPropagationHeaders, ensureRequestContext } from "@/middleware/requestId";
import { fetchApi } from "@/server/fetchApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type HealthPayload = Record<string, unknown>;

/**
 * Build a consistent JSON response with trace context and cache headers.
 * All /status responses include:
 * - x-trace-id: Request correlation ID for debugging
 * - Cache-Control: no-store (never cache health checks)
 * - X-Robots-Tag: noindex (exclude from search engines)
 */
function buildResponse(traceId: string, status: number, body: Record<string, unknown>) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  response.headers.set("x-trace-id", traceId);
  response.headers.set("Content-Type", "application/json");
  return response;
}

/**
 * Health check endpoint: probes upstream API and reports latency.
 *
 * Success (200): { ok: true, p95, traceId, ts, upstream }
 * Failure (503): { ok: false, p95, traceId, ts, error }
 *
 * This endpoint is always public and responds quickly with system health.
 * Used by load balancers, monitoring systems, and application observability tools.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const context = ensureRequestContext(request.headers);
  const propagationHeaders = buildPropagationHeaders(context);

  try {
    // Probe upstream API
    const upstream = await fetchApi<HealthPayload>("/health", { headers: propagationHeaders });
    const latency = Date.now() - startedAt;

    return buildResponse(context.traceId, 200, {
      ok: true,
      p95: latency,
      traceId: context.traceId,
      ts: new Date().toISOString(),
      upstream,
    });
  } catch (error) {
    const latency = Date.now() - startedAt;

    // Structured error response for logs/monitoring
    const errorMessage =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

    // Log error for observability
    if (process.env.NODE_ENV !== "production") {
      console.error(
        JSON.stringify({
          level: "error",
          msg: "/status upstream probe failed",
          traceId: context.traceId,
          latency,
          error: errorMessage,
        })
      );
    }

    return buildResponse(context.traceId, 503, {
      ok: false,
      p95: latency,
      traceId: context.traceId,
      ts: new Date().toISOString(),
      error: {
        code: "UPSTREAM_HEALTH_CHECK_FAILED",
        message: errorMessage,
      },
    });
  }
}
