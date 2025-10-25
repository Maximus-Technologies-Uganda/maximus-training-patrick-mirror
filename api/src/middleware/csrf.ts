import type { RequestHandler } from "express";
import { setCacheControlNoStore } from "../lib/errors";

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

export const requireCsrf: RequestHandler = (req, res, next) => {
  const method = (req.method || "").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const authMethod = (req as unknown as { authContext?: { method?: string } }).authContext?.method;
  if (authMethod === "firebase-bearer") {
    return next();
  }

  // Enforce CSRF primarily for browser-originated requests. Server-to-server calls
  // typically do not include an Origin header. In such contexts, CSRF does not apply.
  const origin = req.get("Origin") || req.headers["origin"];
  if (!origin) return next();

  const headerToken = (req.get("X-CSRF-Token") || req.headers["x-csrf-token"]) as string | undefined;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies["csrf"];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    const requestId = (res.locals.requestId || (req as unknown as { requestId?: string }).requestId) as string | undefined;
    setCacheControlNoStore(res, 403);
    return res.status(403).json({
      code: "FORBIDDEN",
      message: "Invalid CSRF token",
      ...(requestId ? { requestId } : {}),
    });
  }
  next();
};

export default requireCsrf;


