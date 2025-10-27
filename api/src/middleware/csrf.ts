import type { RequestHandler } from "express";
import { createHmac } from "node:crypto";
import { setCacheControlNoStore } from "../lib/errors";
import { getSessionSecret } from "../config";

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

export function validateCsrfToken(token: string): boolean {
  // Parse timestamp-uuid format (T063)
  const parts = token.split('-');
  if (parts.length !== 2) return false;

  const timestamp = parseInt(parts[0], 10);
  if (isNaN(timestamp)) return false;

  // Check TTL: tokens older than 2 hours are invalid (T063)
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  if (age > 2 * 60 * 60) return false; // 2 hours in seconds

  // Check clock skew tolerance: reject tokens from the future (>5 minutes)
  if (timestamp > now + 5 * 60) return false; // 5 minutes in seconds

  // Verify UUID part is not empty
  return parts[1].length > 0;
}

// Format-only validation (no TTL/skew checks). Used by unit tests that verify
// parsing and basic structure without enforcing timing semantics.
export function isCsrfTokenFormatValid(token: string): boolean {
  const parts = token.split('-');
  if (parts.length !== 2) return false;
  const ts = Number(parts[0]);
  if (!Number.isFinite(ts)) return false;
  if (ts < 0) return false;
  return parts[1].length > 0;
}

export const requireCsrf: RequestHandler = (req, res, next) => {
  const method = (req.method || "").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  // Do not bypass CSRF for bearer auth; enforce for browser-originated requests only

  // Enforce CSRF primarily for browser-originated requests. Server-to-server calls
  // typically do not include an Origin header. In such contexts, CSRF does not apply.
  const origin = req.get("Origin") || req.headers["origin"];
  if (!origin) return next();

  const headerToken = (req.get("X-CSRF-Token") || req.headers["x-csrf-token"]) as string | undefined;
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies["csrf"];
  const sessionToken = cookies["session"];
  const authHeaderRaw = (req.get("Authorization") || req.headers["authorization"]) as string | undefined;
  const normalizedAuthHeader = typeof authHeaderRaw === "string" ? authHeaderRaw.trim() : undefined;
  const hasBearerAuthorization = normalizedAuthHeader?.toLowerCase().startsWith("bearer ") ?? false;
  const authContextMethod = (req as unknown as { authContext?: { method?: string } }).authContext?.method;

  if (!sessionToken && (!cookieToken || hasBearerAuthorization || authContextMethod === "firebase-bearer")) {
    // When no session cookie is present we cannot enforce double-submit CSRF tokens.
    // This covers Firebase bearer auth (no cookies) and other sessionless clients.
    return next();
  }

  // Legacy compatibility: if both tokens are present, equal, and lack timestamp delimiter,
  // accept for a migration window (no TTL validation)
  if (headerToken && cookieToken && headerToken === cookieToken && !headerToken.includes('-')) {
    return next();
  }

  // Validate header token format and TTL (T063)
  if (!headerToken || !validateCsrfToken(headerToken)) {
    const requestId = (res.locals.requestId || (req as unknown as { requestId?: string }).requestId) as string | undefined;
    setCacheControlNoStore(res, 403);
    return res.status(403).json({
      code: "FORBIDDEN",
      message: "Invalid or expired CSRF token",
      ...(requestId ? { requestId } : {}),
    });
  }

  // Validate cookie token format and TTL (T063)
  if (!cookieToken || !validateCsrfToken(cookieToken)) {
    const requestId = (res.locals.requestId || (req as unknown as { requestId?: string }).requestId) as string | undefined;
    setCacheControlNoStore(res, 403);
    return res.status(403).json({
      code: "FORBIDDEN",
      message: "Invalid or expired CSRF token",
      ...(requestId ? { requestId } : {}),
    });
  }

  // Double-submit check: tokens must match exactly
  if (headerToken !== cookieToken) {
    const requestId = (res.locals.requestId || (req as unknown as { requestId?: string }).requestId) as string | undefined;
    setCacheControlNoStore(res, 403);
    return res.status(403).json({
      code: "FORBIDDEN",
      message: "CSRF token mismatch",
      ...(requestId ? { requestId } : {}),
    });
  }
  // Session binding: when authenticated session exists, enforce that token suffix is bound
  const userId = (req as unknown as { user?: { userId?: string } }).user?.userId;
  if (userId) {
    try {
      const [tsStr, sig] = headerToken.split('-');
      const ts = Number(tsStr);
      const secret = getSessionSecret();
      const expected = createHmac('sha256', secret)
        .update(`${userId}.${ts}`)
        .digest('hex')
        .slice(0, 32);
      if (sig !== expected) {
        const requestId = (res.locals.requestId || (req as unknown as { requestId?: string }).requestId) as string | undefined;
        setCacheControlNoStore(res, 403);
        return res.status(403).json({
          code: "FORBIDDEN",
          message: "CSRF token mismatch",
          ...(requestId ? { requestId } : {}),
        });
      }
    } catch {
      const requestId = (res.locals.requestId || (req as unknown as { requestId?: string }).requestId) as string | undefined;
      setCacheControlNoStore(res, 403);
      return res.status(403).json({
        code: "FORBIDDEN",
        message: "Invalid or expired CSRF token",
        ...(requestId ? { requestId } : {}),
      });
    }
  }

  next();
};

export default requireCsrf;


