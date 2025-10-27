import type { NextFunction, Request, Response } from "express";
import {
  setCacheControlNoStore,
  ERROR_CODES,
} from "../lib/errors";
import {
  createErrorEnvelope,
  STATUS_BY_CODE
} from "../lib/errors";

interface AppError extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  // Derive status and code from error properties
  const fallbackStatus = err.status ?? err.statusCode;
  const mappedStatus = err.code ? STATUS_BY_CODE[err.code] : undefined;
  const status = fallbackStatus ?? mappedStatus ?? 500;

  // Derive a stable error code when body parser throws 413 (T014/T047)
  let effectiveCode = err.code;
  if (!effectiveCode) {
    const bodyTooLarge = status === 413 || (err as unknown as { type?: string }).type === 'entity.too.large';
    if (bodyTooLarge) {
      effectiveCode = ERROR_CODES.PAYLOAD_TOO_LARGE;
    }
  }

  // Prevent caching of error responses for common API errors (T087)
  setCacheControlNoStore(res, status);

  // Create standardized error envelope (T052)
  const envelope = createErrorEnvelope(
    effectiveCode ?? ERROR_CODES.INTERNAL_ERROR,
    err.message || "Internal Server Error",
    {
      request: req,
      response: res,
      details: err.details,
    }
  );

  res.status(status).json(envelope);
}

export default errorHandler;
