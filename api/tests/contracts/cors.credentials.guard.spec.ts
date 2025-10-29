import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { createRepository } from "../../src/repositories/posts-repository";

async function makeAppWithOrigins(origins: string) {
  const base = loadConfigFromEnv();
  process.env.CORS_ORIGINS = origins;
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('CORS credentials guard (T095)', () => {
  it('does not set Allow-Credentials when Allow-Origin is *', async () => {
    const app = await makeAppWithOrigins('*');
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
  });

  it('sets Allow-Credentials only for exact allowed origins', async () => {
    const app = await makeAppWithOrigins('http://example.com');
    const res = await request(app)
      .options('/health')
      .set('Origin', 'http://example.com')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://example.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});

