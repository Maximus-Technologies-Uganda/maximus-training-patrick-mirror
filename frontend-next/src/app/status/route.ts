import { NextRequest, NextResponse } from "next/server";

import { buildPropagationHeaders, ensureRequestContext } from "@/middleware/requestId";
import { fetchApi } from "@/server/fetchApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type HealthPayload = Record<string, unknown>;

function buildResponse(traceId: string, status: number, body: Record<string, unknown>) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  response.headers.set("x-trace-id", traceId);
  response.headers.set("Content-Type", "application/json");
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const context = ensureRequestContext(request.headers);
  const propagationHeaders = buildPropagationHeaders(context);

  try {
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
    return buildResponse(context.traceId, 503, {
      ok: false,
      p95: latency,
      traceId: context.traceId,
      ts: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Upstream error",
    });
  }
}
