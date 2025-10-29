import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { createRepository } from "../../src/repositories/posts-repository";

async function makeApp(windowMs = 1000, max = 2, jsonLimit = '1kb') {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitWindowMs: windowMs, rateLimitMax: max, jsonLimit };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('Retry-After semantics (T092)', () => {
  it('includes Retry-After on 429 only', async () => {
    const app = await makeApp(1000, 1, '1kb');
    // First request ok
    const ok = await request(app).get('/posts');
    expect(ok.status).toBe(200);
    expect(ok.headers['retry-after']).toBeUndefined();

    // Second within window should be rate-limited
    const limited = await request(app).get('/posts');
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();

    // 413 (payload too large) should not include Retry-After
    const bigApp = await makeApp(1000, 1000, '10b');
    const tooLarge = await request(bigApp)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'a'.repeat(100), content: 'b'.repeat(100) });
    // Body parser may throw a 413 prior to auth
    expect([413, 401]).toContain(tooLarge.status);
    if (tooLarge.status === 413) {
      expect(tooLarge.headers['retry-after']).toBeUndefined();
    }
  });
});

