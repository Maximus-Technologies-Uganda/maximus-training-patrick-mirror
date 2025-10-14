function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function base64urlToBase64(s) {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = t.length % 4 === 0 ? 0 : 4 - (t.length % 4);
  return t + '='.repeat(pad);
}

function safeJson(str) {
  try { return JSON.parse(str); } catch { return null; }
}

const { getSessionSecret } = require('../config');

function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.session;
  if (!token) {
    const requestId = req.requestId || req.headers['x-request-id'];
    console.log(JSON.stringify({ level: 'warn', message: 'Auth failed', requestId }));
    return res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' });
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    const requestId = req.requestId || req.headers['x-request-id'];
    console.log(JSON.stringify({ level: 'warn', message: 'Auth failed', requestId }));
    return res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' });
  }
  const [h, p, sig] = parts;
  const data = `${h}.${p}`;
  // Fetch secret at request time to respect env set during tests
  const secret = getSessionSecret();
  const crypto = require('node:crypto');
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (sig !== expected) {
    const requestId = req.requestId || req.headers['x-request-id'];
    console.log(JSON.stringify({ level: 'warn', message: 'Auth failed', requestId }));
    return res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' });
  }
  const headerJson = Buffer.from(base64urlToBase64(h), 'base64').toString('utf8');
  const payloadJson = Buffer.from(base64urlToBase64(p), 'base64').toString('utf8');
  const header = safeJson(headerJson) || {};
  const payload = safeJson(payloadJson) || {};
  if (header.alg !== 'HS256' || typeof payload.userId !== 'string') {
    const requestId = req.requestId || req.headers['x-request-id'];
    console.log(JSON.stringify({ level: 'warn', message: 'Auth failed', requestId }));
    return res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' });
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || now >= payload.exp) {
    const requestId = req.requestId || req.headers['x-request-id'];
    console.log(JSON.stringify({ level: 'warn', message: 'Auth failed', requestId }));
    return res.status(401).json({ code: 'unauthorized', message: 'Unauthorized' });
  }
  req.user = { userId: payload.userId };
  {
    const requestId = req.requestId || req.headers['x-request-id'];
    console.log(JSON.stringify({ level: 'info', message: 'Auth ok', requestId, userId: payload.userId }));
  }
  next();
}

module.exports = { requireAuth };


