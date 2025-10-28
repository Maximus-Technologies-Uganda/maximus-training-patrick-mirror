jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfigFromEnv } = require('../src/config');
const { createRepository } = require('../src/repositories/posts-repository');

describe('GET /health', () => {
  it('returns 200 with health metadata', async () => {
    const base = loadConfigFromEnv();
    const config = { ...base, rateLimitMax: 1000 };
    const repository = createRepository();
    const app = createApp(config, repository);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'api',
      commit: expect.any(String),
      time: expect.any(String),
      uptime_s: expect.any(Number),
      dependencies: {
        firebase: expect.stringMatching(/^(ok|down)$/),
        db: expect.stringMatching(/^(ok|down)$/),
      },
      requestId: expect.any(String),
      traceId: expect.any(String),
    });
  });
});



