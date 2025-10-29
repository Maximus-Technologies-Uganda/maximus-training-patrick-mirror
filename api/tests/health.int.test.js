<<<<<<< HEAD
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
=======
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



>>>>>>> origin/main
