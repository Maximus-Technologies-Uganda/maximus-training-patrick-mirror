import type { ErrorRequestHandler } from "express";
import { statusByCode } from "../lib/errors";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (statusByCode as Record<string, number>)[(err && (err as any).code) as string] ?? 500;
  res.status(status).json({
    code: (err && (err as any).code) || "internal_error",
    message: (err && (err as any).message) || "Internal Server Error",
    details: (err as any)?.details,
  });
};

export default errorHandler;

