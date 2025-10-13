const { createHmac } = require('node:crypto');

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload, secret, header = { alg: 'HS256', typ: 'JWT' }) {
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;
  const signature = createHmac('sha256', secret).update(data).digest();
  const sigPart = base64url(signature);
  return `${data}.${sigPart}`;
}

function validToken(userId, expSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { userId, iat: now, exp: now + expSeconds };
  const secret = process.env.SESSION_SECRET || 'test-secret';
  return signJwt(payload, secret);
}

function expiredToken(userId) {
  // Ensure token is definitively expired relative to current time
  const now = Math.floor(Date.now() / 1000);
  const payload = { userId, iat: now - 7200, exp: now - 3600 };
  const secret = process.env.SESSION_SECRET || 'test-secret';
  return signJwt(payload, secret);
}

module.exports = { base64url, signJwt, validToken, expiredToken };


