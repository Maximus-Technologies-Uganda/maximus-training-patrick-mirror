import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { createRepository } from "../../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 3 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('Error Cache-Control headers (T087)', () => {
  it('sets Cache-Control: no-store on 401 responses', async () => {
    const app = await makeApp();
    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send({ title: 'x', content: 'y' });
    expect(res.status).toBe(401);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sets Cache-Control: no-store on 429 responses, and omits on 200', async () => {
    const app = await makeApp();
    // consume allowed requests
    await request(app).get('/health');
    await request(app).get('/health');
    await request(app).get('/health');
    const res = await request(app).get('/health');
    expect(res.status).toBe(429);
    expect(res.headers['cache-control']).toBe('no-store');

    // Use a fresh app instance to avoid limiter spillover
    const app2 = await makeApp();
    const ok = await request(app2).get('/');
    expect(ok.status).toBe(200);
    // ok responses may or may not have Cache-Control explicitly set; ensure not 'no-store'
    if (ok.headers['cache-control']) {
      expect(ok.headers['cache-control']).not.toBe('no-store');
    }
  });
});
