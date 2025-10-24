import type { NextFunction, Request, Response } from "express";
import { statusByCode } from "../lib/errors";

interface AppError extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  const fallbackStatus = err.status ?? err.statusCode;
  const mappedStatus = err.code ? statusByCode[err.code] : undefined;
  const status = fallbackStatus ?? mappedStatus ?? 500;

  // Prevent caching of error responses for common API errors (T087)
  if ([401, 403, 413, 422, 429, 503].includes(status)) {
    res.setHeader("Cache-Control", "no-store");
  }

  // Enrich envelope with requestId and optional traceId when available (T111)
  const requestId =
    (req as unknown as { requestId?: string }).requestId ||
    req.get("X-Request-Id") ||
    res.get("X-Request-Id");

  const traceparent = req.get("traceparent");
  let traceId: string | undefined = req.get("x-trace-id");
  if (!traceId && typeof traceparent === "string") {
    const parts = traceparent.split("-");
    if (parts.length >= 4 && parts[1] && /^[0-9a-f]{32}$/i.test(parts[1])) {
      traceId = parts[1];
    }
  }

  res.status(status).json({
    code: err.code ?? "internal_error",
    message: err.message || "Internal Server Error",
    details: err.details,
    ...(requestId ? { requestId } : {}),
    ...(traceId ? { traceId } : {}),
  });
}

export default errorHandler;
