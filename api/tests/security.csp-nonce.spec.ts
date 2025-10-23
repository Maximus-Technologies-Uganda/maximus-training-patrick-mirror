import request from "supertest";
import { createApp } from "../src/app";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('CSP nonce rotation (T109)', () => {
  it('generates different nonces for sequential requests', async () => {
    const app = await makeApp();

    // Make first request and extract nonce from CSP header
    const res1 = await request(app).get('/health');
    expect(res1.status).toBe(200);
    const csp1 = res1.headers['content-security-policy'];
    expect(csp1).toBeDefined();

    // Extract nonce from CSP header (format: script-src 'self' 'nonce-<base64>')
    const nonce1Match = csp1.match(/nonce-([A-Za-z0-9+/=]+)/);
    expect(nonce1Match).toBeTruthy();
    const nonce1 = nonce1Match?.[1];

    // Make second request and extract nonce
    const res2 = await request(app).get('/health');
    expect(res2.status).toBe(200);
    const csp2 = res2.headers['content-security-policy'];
    expect(csp2).toBeDefined();

    const nonce2Match = csp2.match(/nonce-([A-Za-z0-9+/=]+)/);
    expect(nonce2Match).toBeTruthy();
    const nonce2 = nonce2Match?.[1];

    // Nonces must differ to prevent replay attacks
    expect(nonce1).not.toBe(nonce2);
  });

  it('includes nonce in res.locals for template rendering', async () => {
    const app = await makeApp();

    // Use a custom route to verify res.locals.cspNonce is set
    app.get('/test-nonce', (_req, res) => {
      const nonce = res.locals.cspNonce;
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
      res.status(200).json({ nonce });
    });

    const res = await request(app).get('/test-nonce');
    expect(res.status).toBe(200);
    expect(res.body.nonce).toBeDefined();
    expect(typeof res.body.nonce).toBe('string');
  });

  it('nonce is Base64-encoded and of appropriate length', async () => {
    const app = await makeApp();

    const res = await request(app).get('/health');
    const csp = res.headers['content-security-policy'];
    const nonceMatch = csp.match(/nonce-([A-Za-z0-9+/=]+)/);
    const nonce = nonceMatch?.[1];

    expect(nonce).toBeDefined();
    // 16 bytes of random data -> 24 Base64 characters (rounded up)
    expect(nonce?.length).toBeGreaterThanOrEqual(20);
    // Verify it's valid Base64
    expect(/^[A-Za-z0-9+/]+=*$/.test(nonce || '')).toBe(true);
  });
});
