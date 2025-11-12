import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /status - Health check endpoint
 *
 * FR-003: Public status endpoint with health indicators
 * FR-013: Trace propagation
 * FR-021: Always returns 200 with structured payload
 * FR-026: Cache-Control: no-store
 *
 * Response Schema:
 * {
 *   ok: boolean,
 *   traceId: string (uuid),
 *   upstream: { ok: boolean, latency_ms?: number, status?: number },
 *   ts: ISO8601 datetime,
 *   reason?: string (when ok=false)
 * }
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface UpstreamStatus {
  ok: boolean;
  latency_ms?: number;
  status?: number;
}

interface StatusResponse {
  ok: boolean;
  traceId: string;
  upstream: UpstreamStatus;
  ts: string;
  reason?: string;
}

/**
 * Health check endpoint that probes upstream API
 * Always returns 200 regardless of upstream status
 * Includes latency measurement and trace correlation
 */
export async function GET(_request: NextRequest): Promise<NextResponse<StatusResponse>> {
  const traceId = uuidv4();
  const startTime = Date.now();

  try {
    // Get upstream API URL from environment
    let upstreamApiUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!upstreamApiUrl) {
      console.warn(
        "[status route] Neither API_BASE_URL nor NEXT_PUBLIC_API_URL is set; falling back to http://localhost:8080. This may indicate a configuration issue."
      );
      upstreamApiUrl = "http://localhost:8080";
    }

    // Probe upstream health with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let upstreamOk = false;
    let upstreamStatus: number | undefined;
    let upstreamLatency: number | undefined;
    let reason: string | undefined;

    try {
      const upstreamResponse = await fetch(`${upstreamApiUrl}/health`, {
        method: "GET",
        headers: {
          "x-trace-id": traceId,
        },
        signal: controller.signal,
        cache: "no-store",
      });

      upstreamStatus = upstreamResponse.status;
      upstreamLatency = Date.now() - startTime;
      upstreamOk = upstreamResponse.ok && upstreamResponse.status === 200;

      if (!upstreamOk) {
        reason = `Upstream returned HTTP ${upstreamResponse.status}`;
      }
    } catch (error) {
      upstreamLatency = Date.now() - startTime;
      if (error instanceof Error && error.name === "AbortError") {
        reason = "Upstream request timeout (5s exceeded)";
      } else {
        reason = error instanceof Error ? error.message : "Unknown upstream error";
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Build response (always 200)
    const response: StatusResponse = {
      ok: upstreamOk,
      traceId,
      upstream: {
        ok: upstreamOk,
        latency_ms: upstreamLatency,
        status: upstreamStatus,
      },
      ts: new Date().toISOString(),
      reason: upstreamOk ? undefined : reason,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        "x-trace-id": traceId,
      },
    });
  } catch (error) {
    // Fallback error response (still 200 per spec)
    const errorResponse: StatusResponse = {
      ok: false,
      traceId,
      upstream: {
        ok: false,
        latency_ms: Date.now() - startTime,
      },
      ts: new Date().toISOString(),
      reason: error instanceof Error ? error.message : "Internal server error",
    };

    return NextResponse.json(errorResponse, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
        "x-trace-id": traceId,
      },
    });
  }
}
