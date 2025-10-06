import type { NextFunction, Request, Response } from "express";
import { statusByCode } from "../lib/errors";

interface AppError extends Error {
  code?: string;
  status?: number;
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const fallbackStatus = err.status ?? err.statusCode;
  const mappedStatus = err.code ? statusByCode[err.code] : undefined;
  const status = fallbackStatus ?? mappedStatus ?? 500;

  res.status(status).json({
    code: err.code ?? "internal_error",
    message: err.message || "Internal Server Error",
    details: err.details,
  });
}

export default errorHandler;

