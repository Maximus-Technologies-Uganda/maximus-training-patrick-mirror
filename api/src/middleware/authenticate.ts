import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { createHmac } from 'node:crypto';
import { getSessionSecret } from '../config';

export interface HeaderAuthenticationOptions {
  headerName?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: { userId?: string; role?: string };
}

function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);
  return Buffer.from(padded, 'base64');
}

function signJwt(payload: object, secret: string, expiresInSec: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload } as Record<string, unknown>;
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(body));
  const data = `${encHeader}.${encPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest();
  const encSignature = base64url(signature);
  return `${data}.${encSignature}`;
}

function verifyJwt(token: string, secret: string): { userId: string; role?: string } | null {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;

    const data = `${header}.${payload}`;
    const expected = base64url(createHmac('sha256', secret).update(data).digest());
    if (sig !== expected) return null;

    const decodedPayload = JSON.parse(base64urlToBuffer(payload).toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (typeof decodedPayload.exp === 'number' && decodedPayload.exp < now) {
      return null;
    }

    // Check issued at time is not in the future
    if (typeof decodedPayload.iat === 'number' && decodedPayload.iat > now + 300) {
      // 5 minutes skew
      return null;
    }

    if (typeof decodedPayload.userId === 'string') {
      const role = typeof decodedPayload.role === 'string' ? decodedPayload.role : 'owner';
      return { userId: decodedPayload.userId, role };
    }

    return null;
  } catch {
    return null;
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

const resolveHeaderValue = (request: Request, headerName: string): string | null => {
  const header = request.headers[headerName] ?? request.headers[headerName.toLowerCase()];
  if (Array.isArray(header)) {
    const first = header[0];
    return typeof first === 'string' ? first : null;
  }
  if (typeof header === 'string') {
    return header;
  }
  return null;
};

/**
 * Creates middleware that populates `req.user` from JWT session cookies.
 * Handles session rotation for tokens older than 10 minutes.
 */
function createSessionAuthenticationMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies['session'];

    if (!sessionToken) {
      return next();
    }

    const secret = getSessionSecret();
    const decoded = verifyJwt(sessionToken, secret);

    if (!decoded) {
      return next();
    }

    // Check if token needs rotation (older than 10 minutes)
    const [_, payload] = sessionToken.split('.');
    if (payload) {
      try {
        const decodedPayload = JSON.parse(base64urlToBuffer(payload).toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        const iat = typeof decodedPayload.iat === 'number' ? decodedPayload.iat : 0;

        // Rotate if token is older than 10 minutes (600 seconds)
        if (now - iat > 600) {
          const newToken = signJwt({ userId: decoded.userId }, secret, 24 * 60 * 60);

          const isProduction = process.env.NODE_ENV === 'production';
          res.cookie('session', newToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
          });
        }
      } catch {
        // If we can't decode the payload, continue without rotation
      }
    }

    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      role: decoded.role || 'owner',
    };

    next();
  };
}

/**
 * Creates middleware that populates `req.user` from an incoming header value.
 * The middleware is intentionally lightweight and avoids performing any real
 * authentication; it simply exposes the supplied user identifier so that
 * downstream handlers can enforce authorization semantics. A missing or empty
 * header leaves `req.user` undefined.
 */
export const createHeaderAuthenticationMiddleware = (
  options: HeaderAuthenticationOptions = {},
): RequestHandler => {
  const headerName = options.headerName?.toLowerCase() ?? 'x-user-id';

  return (req: Request, _res: Response, next: NextFunction) => {
    const rawValue = resolveHeaderValue(req, headerName);
    const value = typeof rawValue === 'string' ? rawValue.trim() : '';

    if (value) {
      (req as AuthenticatedRequest).user = { userId: value };
    } else {
      delete (req as AuthenticatedRequest).user;
    }

    next();
  };
};

export { createSessionAuthenticationMiddleware };
export { createSessionAuthenticationMiddleware as default };
