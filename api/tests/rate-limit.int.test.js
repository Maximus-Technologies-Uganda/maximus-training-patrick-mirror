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
    const windowSeconds = Math.max(1, Math.ceil(config.rateLimitWindowMs / 1000));

    // Perform max allowed requests
    await request(app).get('/posts');
    await request(app).get('/posts');
    await request(app).get('/posts');

    // Next one should be rate limited
    const res = await request(app).get('/posts');
    expect(res.status).toBe(429);
    // standardHeaders true -> RateLimit headers present
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
    expect(res.headers['ratelimit-reset']).toBeDefined();
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details[0]).toMatchObject({
      scope: 'ip',
      limit: `${config.rateLimitMax} requests per ${windowSeconds} ${windowSeconds === 1 ? 'second' : 'seconds'}`,
      retryAfterSeconds: windowSeconds,
    });
  });
});


