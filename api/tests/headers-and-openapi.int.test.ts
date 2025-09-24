/*
 End-to-end header and body validation for all routes, plus OpenAPI doc route.
*/

jest.mock('nanoid', () => ({ nanoid: () => 'test-id' }));
import request from 'supertest';

// Use JS factories to avoid TS module resolution issues during tests
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createApp } = require('../src/app');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { loadConfigFromEnv } = require('../src/config');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createRepository } = require('../src/repositories/posts-repository');

function makeApp() {
  const base = loadConfigFromEnv();
  // Use generous limiter to avoid flakiness in CI
  const config = { ...base, rateLimitMax: 1000 };
  const repository = createRepository();
  return createApp(config, repository);
}

describe('E2E headers and bodies', () => {
  describe('GET /health', () => {
    it('returns JSON body and rate limit headers', async () => {
      const app = makeApp();
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
      expect(res.body).toEqual({ status: 'ok' });
      expect(res).toSatisfyApiSpec();
    });
  });

  describe('/posts', () => {
    it('POST /posts returns 201 with Location and JSON body', async () => {
      const app = makeApp();
      const res = await request(app)
        .post('/posts')
        .send({ title: 'Hello', content: 'World' })
        .set('Content-Type', 'application/json');
      expect(res.status).toBe(201);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers['location']).toMatch(/^\/posts\/[A-Za-z0-9_-]+$/);
      expect(typeof res.body.id).toBe('string');
      expect(res).toSatisfyApiSpec();
    });

    it('GET /posts returns JSON list response', async () => {
      const app = makeApp();
      await request(app).post('/posts').send({ title: 'A', content: 'aaa' });
      const res = await request(app).get('/posts');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('items');
      expect(res).toSatisfyApiSpec();
    });

    it('GET /posts invalid query returns 400 with JSON error body', async () => {
      const app = makeApp();
      const res = await request(app).get('/posts?page=0');
      expect(res.status).toBe(400);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('message');
      expect(res).toSatisfyApiSpec();
    });
  });

  describe('/posts/:id', () => {
    it('GET returns 200 JSON on success and 404 JSON on missing', async () => {
      const app = makeApp();
      const created = await request(app).post('/posts').send({ title: 'X', content: 'Y' });
      const id = created.body.id as string;

      const ok = await request(app).get(`/posts/${id}`);
      expect(ok.status).toBe(200);
      expect(ok.headers['content-type']).toMatch(/application\/json/);
      expect(ok).toSatisfyApiSpec();

      const missing = await request(app).get('/posts/does-not-exist');
      expect(missing.status).toBe(404);
      expect(missing.headers['content-type']).toMatch(/application\/json/);
      expect(missing.body).toHaveProperty('code', 'not_found');
      expect(missing).toSatisfyApiSpec();
    });

    it('PUT and PATCH return JSON body; DELETE returns 204 with no body', async () => {
      const app = makeApp();
      // Seed a post; with mocked nanoid, the id will be 'test-id'
      await request(app).post('/posts').send({ title: 'P', content: 'C' });

      const putRes = await request(app).put('/posts/test-id').send({ title: 'New', content: 'Text' });
      expect(putRes.status).toBe(200);
      expect(putRes.headers['content-type']).toMatch(/application\/json/);
      expect(putRes).toSatisfyApiSpec();

      const patchRes = await request(app).patch('/posts/test-id').send({ title: 'Updated' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.headers['content-type']).toMatch(/application\/json/);
      expect(patchRes).toSatisfyApiSpec();

      const delRes = await request(app).delete('/posts/test-id');
      expect(delRes.status).toBe(204);
      // 204 responses should not include a body
      expect(delRes.text).toBe('');
    });
  });
});

describe('GET /openapi.json', () => {
  it('serves the OpenAPI document as JSON', async () => {
    const app = makeApp();
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('openapi', '3.1.0');
  });
});


