const request = require('supertest');

const { createApp } = require('#tsApp');
const { loadConfigFromEnv } = require('../src/config');
const { createRepository } = require('../src/repositories/posts-repository');

describe('GET /health', () => {
  it('returns the expected health payload', async () => {
    const base = loadConfigFromEnv();
    const config = { ...base, rateLimitMax: 1000 };
    const repository = await createRepository();
    const app = createApp(config, repository);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['retry-after']).toBeUndefined();
    expect(res.body).toMatchObject({
      service: 'api',
      status: 'ok',
      dependencies: { firebase: 'ok', db: 'ok' },
    });
    expect(typeof res.body.commit).toBe('string');
    expect(typeof res.body.time).toBe('string');
    expect(typeof res.body.uptime_s).toBe('number');
  });
});
