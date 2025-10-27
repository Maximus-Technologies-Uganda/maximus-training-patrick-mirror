jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfigFromEnv } = require('../src/config');
const { createRepository } = require('../src/repositories/posts-repository');

describe('GET /health', () => {
  it('returns 200 with { status: "ok", service: "api" }', async () => {
    const base = loadConfigFromEnv();
    const config = { ...base, rateLimitMax: 1000 };
    const repository = createRepository();
    const app = createApp(config, repository);

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'api' });
  });
});



