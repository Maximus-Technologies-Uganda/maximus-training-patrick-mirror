import type { RequestHandler } from "express";
import { randomUUID, randomBytes } from "node:crypto";

const TRACEPARENT_REGEX = /^(?<version>[0-9a-f]{2})-(?<traceId>[0-9a-f]{32})-(?<spanId>[0-9a-f]{16})-(?<flags>[0-9a-f]{2})$/i;
const TRACE_FLAGS = "01";

function generateTraceId(): string {
  let traceId = "";
  do {
    traceId = randomBytes(16).toString("hex");
  } while (traceId === "00000000000000000000000000000000");
  return traceId;
}

function generateSpanId(): string {
  let spanId = "";
  do {
    spanId = randomBytes(8).toString("hex");
  } while (spanId === "0000000000000000");
  return spanId;
}

function generateTraceIdentifiers(): { traceId: string; spanId: string; header: string } {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const header = `00-${traceId}-${spanId}-${TRACE_FLAGS}`;
  return { traceId, spanId, header };
}

function parseTraceparent(value: string | undefined): {
  traceId: string;
  header: string;
  parentSpanId?: string;
} {
  if (!value) return generateTraceIdentifiers();
  const match = TRACEPARENT_REGEX.exec(value.trim());
  if (!match?.groups) {
    return generateTraceIdentifiers();
  }
  const { traceId, spanId, version, flags } = match.groups as Record<string, string>;
  if (traceId === "00000000000000000000000000000000" || spanId === "0000000000000000") {
    return generateTraceIdentifiers();
  }
  const newSpanId = generateSpanId();
  const normalized = `${version}-${traceId}-${newSpanId}-${flags}`.toLowerCase();
  return {
    traceId: traceId.toLowerCase(),
    header: normalized,
    parentSpanId: spanId.toLowerCase(),
  };
}

function normalizeTracestate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  // Enforce W3C maximum length of 512 characters.
  return trimmed.slice(0, 512);
}

// Augment Express Request to include observability metadata.
declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    traceId?: string;
    traceparent?: string;
    tracestate?: string;
    parentSpanId?: string;
    user?: {
      userId?: string;
      role?: string;
    };
  }
}

declare module "http" {
  interface IncomingMessage {
    requestId?: string;
  }
}

export const requestId: RequestHandler = (req, res, next) => {
  const incomingId = (req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined;
  const requestIdValue = typeof incomingId === "string" && incomingId.trim().length > 0 ? incomingId.trim() : randomUUID();
  req.requestId = requestIdValue;
  res.setHeader("X-Request-Id", requestIdValue);

  const parsedTraceparent = parseTraceparent(
    req.get("traceparent") ?? (req.headers["traceparent"] as string | undefined),
  );
  req.traceId = parsedTraceparent.traceId;
  req.traceparent = parsedTraceparent.header;
  if (parsedTraceparent.parentSpanId) {
    req.parentSpanId = parsedTraceparent.parentSpanId;
  }
  res.setHeader("Traceparent", parsedTraceparent.header);

  const incomingTracestate = normalizeTracestate(req.get("tracestate") ?? (req.headers["tracestate"] as string | undefined));
  if (incomingTracestate) {
    req.tracestate = incomingTracestate;
    res.setHeader("Tracestate", incomingTracestate);
  }

  next();
};

export default requestId;
