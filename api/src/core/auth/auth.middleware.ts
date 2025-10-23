import type { RequestHandler } from "express";
import { createHmac } from "node:crypto";
import { getSessionSecret } from "../../config";

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

// Resolve the secret per request to ensure tests that set env at runtime work
// and to avoid caching stale values across test files.

export const requireAuth: RequestHandler = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["session"];
  const secret = getSessionSecret();
  const payload: Record<string, unknown> | null = token ? verifyJwt(token, secret) : null;
  if (!payload || typeof (payload as Record<string, unknown>).userId !== "string") {
    const requestId =
      (req as unknown as { requestId?: string }).requestId ||
      ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
    console.log(JSON.stringify({ level: "warn", message: "Auth failed", requestId }));
    // T087: Prevent caching of 401 responses
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ code: "unauthorized", message: "Unauthorized" });
  }
  (req as unknown as { user?: { userId: string } }).user = { userId: (payload as { userId: string }).userId };
  {
    const requestId =
      (req as unknown as { requestId?: string }).requestId ||
      ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined);
    const userId = (payload as { userId: string }).userId;
    console.log(JSON.stringify({ level: "info", message: "Auth ok", requestId, userId }));
  }
  next();
};

export default requireAuth;


