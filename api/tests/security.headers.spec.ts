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

describe('security headers (T084)', () => {
  it('includes COOP, CORP and Permissions-Policy headers', async () => {
    const app = await makeApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
    expect(res.headers['permissions-policy']).toBe(
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );
    // Basic CSP presence check with nonce marker
    expect(res.headers['content-security-policy']).toContain("script-src 'self' 'nonce-");
  });
});

