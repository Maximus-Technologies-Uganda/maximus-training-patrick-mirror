const { createHmac } = require('node:crypto');
const { getSessionSecret } = require('../config');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlToBuffer(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(paddingLength);
  return Buffer.from(padded, 'base64');
}

function signJwt(payload, secret, expiresInSec) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(body));
  const data = `${encHeader}.${encPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest();
  const encSignature = base64url(signature);
  return `${data}.${encSignature}`;
}

function verifyJwt(token, secret) {
  try {
    const [header, payload, sig] = token.split('.');
    if (!header || !payload || !sig) return null;

    const data = `${header}.${payload}`;
    const expected = base64url(createHmac('sha256', secret).update(data).digest());
    if (sig !== expected) return null;

    const decodedPayload = JSON.parse(base64urlToBuffer(payload).toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (typeof decodedPayload.exp === 'number' && decodedPayload.exp < now) {
      return null;
    }

    if (typeof decodedPayload.iat === 'number' && decodedPayload.iat > now + 300) {
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

function parseCookies(header) {
  const result = {};
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

function resolveHeaderValue(req, headerName) {
  const header = req.headers[headerName] ?? req.headers[headerName.toLowerCase()];
  if (Array.isArray(header)) {
    const [first] = header;
    return typeof first === 'string' ? first : null;
  }
  return typeof header === 'string' ? header : null;
}

function createSessionAuthenticationMiddleware() {
  return function sessionAuthentication(req, res, next) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies.session;

    if (!sessionToken) {
      return next();
    }

    const secret = getSessionSecret();
    const decoded = verifyJwt(sessionToken, secret);

    if (!decoded) {
      return next();
    }

    const [, payload] = sessionToken.split('.');
    if (payload) {
      try {
        const decodedPayload = JSON.parse(base64urlToBuffer(payload).toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        const iat = typeof decodedPayload.iat === 'number' ? decodedPayload.iat : 0;

        if (now - iat > 600) {
          const newToken = signJwt({ ...decoded }, secret, 24 * 60 * 60);

          const isProduction = process.env.NODE_ENV === 'production';
          if (typeof res.cookie === 'function') {
            res.cookie('session', newToken, {
              httpOnly: true,
              secure: isProduction,
              sameSite: 'strict',
              maxAge: 24 * 60 * 60 * 1000,
            });
          }
        }
      } catch {
        // ignore malformed payloads and continue without rotation
      }
    }

    req.user = { userId: decoded.userId, role: decoded.role || 'owner' };

    next();
  };
}

function createHeaderAuthenticationMiddleware(options = {}) {
  const headerName = (options.headerName || 'x-user-id').toLowerCase();

  return function headerAuthentication(req, _res, next) {
    const rawValue = resolveHeaderValue(req, headerName);
    const value = typeof rawValue === 'string' ? rawValue.trim() : '';

    if (value) {
      req.user = { userId: value };
    } else if (req.user) {
      delete req.user;
    }

    next();
  };
}

module.exports = { createHeaderAuthenticationMiddleware, createSessionAuthenticationMiddleware };
