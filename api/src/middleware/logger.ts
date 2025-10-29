import type { RequestHandler, Response } from "express";
import { defaultLogger } from "../logging/observability";
import type { LogFields } from "../logging/observability";
import type { LogLevel } from "../logging/sampling";

function determineLevel(status: number): LogLevel {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}

function parseHeaderNumber(value: number | string | readonly string[] | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const parsed = parseHeaderNumber(entry);
      if (typeof parsed === "number") {
        return parsed;
      }
    }
  }
  return undefined;
}

function collectRateLimit(res: Response): LogFields["rateLimit"] | undefined {
  const limit = parseHeaderNumber(res.getHeader("ratelimit-limit"));
  const remaining = parseHeaderNumber(res.getHeader("ratelimit-remaining"));
  const reset = parseHeaderNumber(res.getHeader("ratelimit-reset"));
  const retryAfter = parseHeaderNumber(res.getHeader("retry-after"));
  const snapshot: LogFields["rateLimit"] = { limit, remaining, reset, retryAfter };
  return Object.values(snapshot).some((value) => typeof value === "number") ? snapshot : undefined;
}

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedNs = process.hrtime.bigint() - start;
    const durationMs = Number(elapsedNs) / 1_000_000;
    const level = determineLevel(res.statusCode);
    const rateLimit = collectRateLimit(res);

    defaultLogger.log(level, "request completed", {
      requestId: (req as unknown as { requestId?: string }).requestId,
      traceId: (req as unknown as { traceId?: string }).traceId,
      method: req.method,
      path: (req as unknown as { originalUrl?: string }).originalUrl || req.path,
      status: res.statusCode,
      durationMs,
      userId: (req as unknown as { user?: { userId?: string } }).user?.userId,
      role: (req as unknown as { user?: { role?: string } }).user?.role,
      ...(rateLimit ? { rateLimit } : {}),
    });
  });

  next();
};

export default requestLogger;
