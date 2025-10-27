import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { setCacheControlNoStore } from "../lib/errors";

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

/**
 * Validates if a string is a valid IPv4 or IPv6 address
 */
function isValidIp(ip: string): boolean {
  // IPv4: 0.0.0.0 to 255.255.255.255
  const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6: simplified pattern (full validation is complex, this catches common cases)
  const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/;
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Rate limit key derivation precedence (T108):
 * - Prefer authenticated user id when present
 * - Fallback to client IP
 * - Only honours X-Forwarded-For when Express trust proxy is enabled
 * - Validates X-Forwarded-For entries to prevent header injection
 */
function shouldTrustProxy(req: Request): boolean {
  const remoteAddress = req.socket?.remoteAddress;
  const trustProxyFn = req.app?.get?.("trust proxy fn") as
    | ((addr: string, index: number) => boolean)
    | undefined;

  if (typeof trustProxyFn === "function" && remoteAddress) {
    try {
      return Boolean(trustProxyFn(remoteAddress, 0));
    } catch {
      // Fall back to standard evaluation below if the trust function throws
    }
  }

  const trustProxy = req.app?.get?.("trust proxy");

  if (typeof trustProxy === "function") {
    if (!remoteAddress) {
      return false;
    }

    try {
      return Boolean(trustProxy(remoteAddress, 0));
    } catch {
      return false;
    }
  }

  if (typeof trustProxy === "boolean") {
    return trustProxy;
  }

  if (typeof trustProxy === "number") {
    return trustProxy > 0;
  }

  if (typeof trustProxy === "string") {
    const normalized = trustProxy.trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    return normalized !== "false" && normalized !== "0";
  }

  return Boolean(trustProxy);
}

function getUserId(req: Request): string | undefined {
  const maybeUser = (req as unknown as { user?: { userId?: string; id?: string } }).user;

  if (!maybeUser) {
    return undefined;
  }

  const candidate = maybeUser.userId ?? maybeUser.id;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }

  return undefined;
}

function getRemoteIp(req: Request): string {
  const remoteAddress = req.socket?.remoteAddress?.trim();
  if (remoteAddress) {
    return remoteAddress;
  }

  const candidate = req.ip?.trim();
  if (candidate && isValidIp(candidate)) {
    return candidate;
  }

  return "unknown";
}

function deriveKey(req: Request): string {
  // Per-app salt to avoid cross-test/process contamination of the in-memory store (Jest/CI isolation)
  // Falls back to empty string when not set.
  // This ensures different Express app instances do not share rate-limit buckets inadvertently.
  // The salt is set in app.locals.rateLimitSalt during app boot.
  const salt = (() => {
    try {
      const val = (req.app?.locals as unknown as { rateLimitSalt?: string })?.rateLimitSalt;
      return typeof val === "string" ? val : "";
    } catch {
      return "";
    }
  })();
  // Prefer authenticated user id when present
  const userId = getUserId(req);
  if (userId) {
    return `u:${userId}${salt ? `:s<${salt}>` : ''}`;
  }

  // Extract and validate X-Forwarded-For (first IP only)
  let ip = getRemoteIp(req);

  if (shouldTrustProxy(req)) {
    const header = req.headers["x-forwarded-for"];
    const forwardedValues = Array.isArray(header)
      ? header
      : typeof header === "string"
        ? header.split(",")
        : [];

    const forwardedIp = forwardedValues
      .map((value) => value.trim())
      .find((candidate) => candidate && isValidIp(candidate));

    if (forwardedIp) {
      ip = forwardedIp;
    }
  }

  return `ip:${ip}${salt ? `:s<${salt}>` : ''}`;
}

export function createRateLimiter(config: RateLimitConfig) {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => deriveKey(req),
    // Skip rate limiting for OPTIONS requests (CORS preflight) - T038
    skip: (req: Request) => req.method === "OPTIONS",
    handler: (req: Request, res: Response) => {
      const seconds = Math.ceil(config.windowMs / 1000);
      res.setHeader("Retry-After", String(seconds));
      setCacheControlNoStore(res, 429);
      const requestId =
        (req as unknown as { requestId?: string }).requestId ||
        ((req.get("X-Request-Id") || req.headers["x-request-id"]) as string | undefined) ||
        (res.get("X-Request-Id") as string | undefined) ||
        undefined;
      res.status(429).json({
        code: "RATE_LIMITED",
        message: "Rate limit exceeded. Please try again later.",
        ...(requestId ? { requestId } : {}),
      });
    },
  });
}

// Note: Do not export a default to avoid CommonJS/ESM interop issues in ts-jest.
