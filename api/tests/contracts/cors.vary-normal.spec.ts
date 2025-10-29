import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { createRepository } from "../../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('CORS vary header on normal responses (T085)', () => {
  it('adds Vary: Origin on GET/POST responses', async () => {
    const app = await makeApp();
    const res1 = await request(app).get('/health').set('Origin', 'http://localhost:3000');
    expect(res1.status).toBe(200);
    expect(res1.headers['vary']).toBeDefined();
    expect(String(res1.headers['vary'])).toContain('Origin');

    const res2 = await request(app).get('/').set('Origin', 'http://localhost:3000');
    expect(res2.status).toBe(200);
    expect(res2.headers['vary']).toBeDefined();
    expect(String(res2.headers['vary'])).toContain('Origin');
  });
});

