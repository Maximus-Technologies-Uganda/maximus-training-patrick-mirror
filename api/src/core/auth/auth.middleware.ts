import type { RequestHandler } from "express";
import { createHmac } from "node:crypto";
import { getSessionSecret } from "../../config";
import { setCacheControlNoStore } from "../../lib/errors";

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  const parts = header.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

function base64urlToBase64(input: string): string {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  return s + "=".repeat(pad);
}

function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function verifyJwt(token: string, secret: string): null | Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const data = `${h}.${p}`;
  const expected = base64urlEncode(createHmac("sha256", secret).update(data).digest());
  if (sig !== expected) return null;
  try {
    const headerJson = Buffer.from(base64urlToBase64(h), "base64").toString("utf8");
    const payloadJson = Buffer.from(base64urlToBase64(p), "base64").toString("utf8");
    const header = JSON.parse(headerJson) as { alg?: string };
    if (header.alg !== "HS256") return null;
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : NaN;
    if (!Number.isFinite(exp)) return null;
    const now = Math.floor(Date.now() / 1000);
    if (now >= exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function signJwt(payload: Record<string, unknown>, secret: string, expiresInSec: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload } as Record<string, unknown>;
  const encHeader = base64urlEncode(Buffer.from(JSON.stringify(header)));
  const encPayload = base64urlEncode(Buffer.from(JSON.stringify(body)));
  const data = `${encHeader}.${encPayload}`;
  const signature = createHmac("sha256", secret).update(data).digest();
  return `${data}.${base64urlEncode(signature)}`;
}

function shouldRotateToken(payload: Record<string, unknown>): boolean {
  const iat = typeof payload.iat === "number" ? payload.iat : NaN;
  if (!Number.isFinite(iat)) return false;

  const now = Math.floor(Date.now() / 1000);
  // T062: Rotate if token is older than 10 minutes (5 minutes before 15-minute expiry)
  const tokenAge = now - iat;
  return tokenAge > 10 * 60; // 10 minutes
}

// Resolve the secret per request to ensure tests that set env at runtime work
// and to avoid caching stale values across test files.

export const requireAuth: RequestHandler = (req, res, next) => {
  // If a previous middleware already attached a verified user (e.g., Firebase bearer), honor it
  if ((req as unknown as { user?: { userId?: string } }).user?.userId) {
    return next();
  }
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["session"];
  const secret = getSessionSecret();
  const payload: Record<string, unknown> | null = token ? verifyJwt(token, secret) : null;
  if (!payload || typeof (payload as Record<string, unknown>).userId !== "string") {
    const requestId =
      (req as unknown as { requestId?: string }).requestId ||
      ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
    console.log(JSON.stringify({ level: "warn", message: "Auth failed", requestId }));
    // Prevent caching of 401 responses (T087)
    setCacheControlNoStore(res, 401);
    // Include requestId and optional traceId (T111)
    const traceparent = (req.get("traceparent") || req.headers["traceparent"]) as string | undefined;
    let traceId: string | undefined = (req.get("x-trace-id") || req.headers["x-trace-id"]) as string | undefined;
    if (!traceId && typeof traceparent === 'string') {
      const parts = traceparent.split('-');
      if (parts.length >= 4 && parts[1] && /^[0-9a-f]{32}$/i.test(parts[1])) {
        traceId = parts[1];
      }
    }
    return res.status(401).json({ code: "unauthorized", message: "Unauthorized", ...(requestId ? { requestId } : {}), ...(traceId ? { traceId } : {}) });
  }

  // T062: Check if token should be rotated (older than 10 minutes or role changed)
  const shouldRotate = shouldRotateToken(payload);

  (req as unknown as { user?: { userId: string; role?: string } }).user = {
    userId: (payload as { userId: string }).userId,
    role: (payload as { role?: string }).role || "owner"
  };
  (req as unknown as { authContext?: { method?: string } }).authContext = { method: "session-cookie" };

  // Rotate token if needed
  if (shouldRotate) {
    const newToken = signJwt({
      userId: (payload as { userId: string }).userId,
      role: (payload as { role?: string }).role || "owner"
    }, secret, 15 * 60);

    res.cookie("session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
  }

  {
    const requestId =
      (req as unknown as { requestId?: string }).requestId ||
      ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
    const userId = (payload as { userId: string }).userId;
    console.log(JSON.stringify({ level: "info", message: "Auth ok", requestId, userId, ...(shouldRotate ? { rotated: true } : {}) }));
  }
  next();
};

export default requireAuth;

