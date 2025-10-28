import { randomBytes } from "node:crypto";

const TRACEPARENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

export interface TraceContext {
  traceparent: string;
  traceId: string;
  spanId: string;
  sampled: boolean;
}

export function parseTraceparent(value: string | undefined | null): TraceContext | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = TRACEPARENT_REGEX.exec(trimmed);
  if (!match) return null;
  const [, traceId, spanId, flags] = match;
  if (!traceId || /^0+$/.test(traceId)) return null;
  if (!spanId || /^0+$/.test(spanId)) return null;
  return {
    traceparent: `00-${traceId.toLowerCase()}-${spanId.toLowerCase()}-${flags.toLowerCase()}`,
    traceId: traceId.toLowerCase(),
    spanId: spanId.toLowerCase(),
    sampled: (parseInt(flags, 16) & 0x01) === 0x01,
  };
}

export function generateTraceContext(): TraceContext {
  const traceId = randomBytes(16).toString("hex");
  const spanId = randomBytes(8).toString("hex");
  const flags = "01";
  return {
    traceId,
    spanId,
    sampled: true,
    traceparent: `00-${traceId}-${spanId}-${flags}`,
  };
}

export function ensureTraceContext(value: string | undefined | null): TraceContext {
  const parsed = parseTraceparent(value);
  if (parsed) return parsed;
  return generateTraceContext();
}

export function formatTraceparent(context: TraceContext, spanId?: string): string {
  const nextSpanId = spanId ?? context.spanId;
  return `00-${context.traceId}-${nextSpanId}-${context.sampled ? "01" : "00"}`;
}

export function extractTraceId(value: string | undefined | null): string | undefined {
  const parsed = parseTraceparent(value);
  return parsed?.traceId;
}

