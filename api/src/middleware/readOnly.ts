import type { Request, Response, NextFunction, RequestHandler } from "express";
import { setCacheControlNoStore } from "../lib/errors";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getRequestId(req: Request, res: Response): string | undefined {
  const reqWithId = (req as unknown as { requestId?: string }).requestId;
  const fromHeader = res.get("X-Request-Id");
  const fromLocals = (res.locals as unknown as { requestId?: string }).requestId;
  return reqWithId || (typeof fromHeader === "string" ? fromHeader : undefined) || fromLocals || undefined;
}

/**
 * Read-only guard (T036):
 * When READ_ONLY=true, deny mutating HTTP methods with 503 envelope.
 * - Does not affect OPTIONS requests (handled by CORS preflight)
 * - Returns standardized envelope including requestId when present
 * - Prevents caching via Cache-Control: no-store
 */
export const readOnlyGuard: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "OPTIONS") return next();
  const isReadOnly = String(process.env.READ_ONLY || "").toLowerCase() === "true";
  if (!isReadOnly) return next();
  if (!MUTATING.has(req.method)) return next();

  const requestId = getRequestId(req, res);
  setCacheControlNoStore(res as unknown as Response, 503);
  return res.status(503).json({
    code: "SERVICE_UNAVAILABLE",
    message: "Service is in read-only mode",
    ...(requestId ? { requestId } : {}),
  });
};

export default readOnlyGuard;

