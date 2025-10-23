const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfigFromEnv } = require('../src/config');
const { InMemoryPostsRepository } = require('../src/repositories/posts-repository');

describe('Rate limiting', () => {
  it('returns 429 Too Many Requests after exceeding limit', async () => {
    const base = loadConfigFromEnv();
    const config = { ...base, rateLimitWindowMs: 1000, rateLimitMax: 3 };
    const repository = new InMemoryPostsRepository();
    const app = createApp(config, repository);

    // Perform max allowed requests
    await request(app).get('/health');
    await request(app).get('/health');
    await request(app).get('/health');

    // Next one should be rate limited
    const res = await request(app).get('/health');
    expect(res.status).toBe(429);
    // standardHeaders true -> RateLimit headers present
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
    expect(res.headers['ratelimit-reset']).toBeDefined();
  });
});


