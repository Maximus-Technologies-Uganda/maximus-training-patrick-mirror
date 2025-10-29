const express = require('express');
const { createHmac } = require('node:crypto');
const { getSessionSecret } = require('../config');

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload, secret, expiresInSec) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload };
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(body));
  const data = `${encHeader}.${encPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest();
  return `${data}.${base64url(signature)}`;
}

function createAuthRoutes() {
  const router = express.Router();
  const isProduction = process.env.NODE_ENV === 'production';

  router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const valid =
      (username === 'admin' && password === 'password') ||
      (username === 'alice' && password === 'correct-password');
    if (!valid) {
      const requestId = req.requestId || req.get('X-Request-Id') || req.headers['x-request-id'];
      console.warn(JSON.stringify({ level: 'warn', message: 'Invalid credentials', requestId }));
      return res.status(401).send();
    }

    const secret = getSessionSecret();
    const userId = username === 'admin' ? 'admin-1' : 'user-alice-1';
    const token = signJwt({ userId }, secret, 24 * 60 * 60);

    res.cookie('session', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    const requestId = req.requestId || req.get('X-Request-Id') || req.headers['x-request-id'];
    console.warn(
      JSON.stringify({
        level: 'warn',
        message: 'User authenticated successfully',
        requestId,
        userId,
      }),
    );
    return res.status(204).send();
  });

  router.post('/logout', (req, res) => {
    // Idempotent: clear cookie even if not present
    res.cookie('session', '', { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 0 });
    const requestId = req.requestId || req.get('X-Request-Id') || req.headers['x-request-id'];
    console.warn(JSON.stringify({ level: 'warn', message: 'User logged out', requestId }));
    return res.status(204).send();
  });

  return router;
}

module.exports = { createAuthRoutes };
