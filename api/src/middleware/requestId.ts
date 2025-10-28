import type { RequestHandler, Response } from "express";
import { randomUUID } from "node:crypto";
import {
  ensureTraceContext,
  extractTraceId,
  formatTraceparent,
  parseTraceparent,
  type TraceContext,
} from "../lib/tracing";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    traceId?: string;
    traceparent?: string;
    tracestate?: string;
  }
}

function getHeader(req: Parameters<RequestHandler>[0], name: string): string | undefined {
  const lower = name.toLowerCase();
  const headers = req.headers as Record<string, unknown>;
  const raw = (req.get(name) || headers[lower]) as string | undefined;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function ensureLocals(res: Parameters<RequestHandler>[1]): Response & { locals: Record<string, unknown> } {
  const r = res as unknown as Response & { locals: Record<string, unknown> };
  if (r.locals == null || typeof r.locals !== "object") {
    r.locals = {};
  }
  return r;
}

function determineTraceContext(req: Parameters<RequestHandler>[0]): TraceContext {
  const incomingTraceparent = getHeader(req, "traceparent");
  return ensureTraceContext(incomingTraceparent);
}

export const requestId: RequestHandler = (req, res, next) => {
  const incomingId = getHeader(req, "x-request-id");
  const requestId = incomingId ?? randomUUID();
  const tracestate = getHeader(req, "tracestate");
  const traceContext = determineTraceContext(req);

  req.requestId = requestId;
  req.traceparent = traceContext.traceparent;
  req.traceId = traceContext.traceId;
  if (tracestate) req.tracestate = tracestate;

  const locals = ensureLocals(res);
  locals.locals.requestId = requestId;
  locals.locals.traceparent = traceContext.traceparent;
  locals.locals.traceId = traceContext.traceId;
  if (tracestate) locals.locals.tracestate = tracestate;

  res.setHeader("X-Request-Id", requestId);
  res.setHeader("traceparent", traceContext.traceparent);
  if (tracestate) {
    res.setHeader("tracestate", tracestate);
  }

  res.on("finish", () => {
    try {
      // Normalize headers before response is sent back for downstream correlation
      const outgoingTraceparent = res.getHeader("traceparent");
      if (typeof outgoingTraceparent === "string") {
        const normalized = parseTraceparent(outgoingTraceparent);
        if (normalized) {
          res.setHeader("traceparent", formatTraceparent(normalized));
          locals.locals.traceId = normalized.traceId;
        }
      }
      if (!res.getHeader("X-Request-Id")) {
        res.setHeader("X-Request-Id", requestId);
      }
    } catch {
      // noop: tracing normalization is best effort
    }
  });

  next();
};

export function getEffectiveTraceId(req: { traceId?: string }, res: { getHeader: (name: string) => number | string | string[] | undefined }): string | undefined {
  if (req.traceId) return req.traceId;
  const outgoing = res.getHeader("traceparent");
  if (typeof outgoing === "string") {
    return extractTraceId(outgoing);
  }
  return undefined;
}

export default requestId;


