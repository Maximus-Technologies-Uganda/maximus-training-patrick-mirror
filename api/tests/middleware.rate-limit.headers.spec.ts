import request from "supertest";
import { createApp } from "../src/app";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 3 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('RateLimit standard headers numeric (T098)', () => {
  /**
   * Header Case Note:
   * express-rate-limit with standardHeaders:true emits RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
   * (no "X-" prefix, per IETF draft standard).
   * HTTP headers are case-insensitive; Express normalizes them to lowercase in res.headers object.
   * The actual wire format uses the canonical case, but tests access via lowercase keys.
   */
  it('emits numeric RateLimit headers', async () => {
    const app = await makeApp();
    const res = await request(app).get('/posts');
    expect(res.status).toBe(200);

    // Access headers via lowercase keys (Express normalization)
    const limit = res.headers['ratelimit-limit'];
    const remaining = res.headers['ratelimit-remaining'];
    const reset = res.headers['ratelimit-reset'];

    expect(limit).toBeDefined();
    expect(remaining).toBeDefined();
    expect(reset).toBeDefined();

    // Verify numeric values (Spectral schema requirement)
    expect(Number.isNaN(Number(limit))).toBe(false);
    expect(Number.isNaN(Number(remaining))).toBe(false);
    expect(Number.isNaN(Number(reset))).toBe(false);
  });

  it('exposes RateLimit headers via CORS (T061)', async () => {
    const app = await makeApp();
    const res = await request(app)
      .get('/posts')
      .set('Origin', 'http://localhost:3000');

    expect(res.status).toBe(200);

    // Verify CORS exposure header includes rate-limit headers
    const exposeHeaders = res.headers['access-control-expose-headers'];
    expect(exposeHeaders).toBeDefined();
    expect(exposeHeaders).toContain('X-RateLimit-Limit');
    expect(exposeHeaders).toContain('X-RateLimit-Remaining');
    expect(exposeHeaders).toContain('Retry-After');
  });
});

