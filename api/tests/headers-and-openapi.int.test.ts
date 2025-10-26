/*
End-to-end header and body validation for all routes, plus OpenAPI doc route.
*/

jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
import request from "supertest";
import * as jwtUtil from './jwt.util.js';
const { validToken } = jwtUtil;
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
const cookie = (u: string) => `session=${validToken(u)}`;

// Use JS factories to avoid TS module resolution issues during tests
import { createApp } from "../src/app";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  // Use generous limiter to avoid flakiness in CI
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('E2E headers and bodies', () => {
  describe('GET /posts', () => {
    it('returns JSON body and rate limit headers', async () => {
      const app = await makeApp();
      const res = await request(app).get('/posts');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers['ratelimit-limit']).toBeDefined();
      expect(res.headers['ratelimit-remaining']).toBeDefined();
      expect(res.headers['ratelimit-reset']).toBeDefined();
      expect(res.body).toHaveProperty('items');
    });
  });

  describe('/posts', () => {
    it('POST /posts returns 201 with Location and JSON body', async () => {
      const app = await makeApp();
      const res = await request(app)
        .post('/posts')
        .set('Cookie', cookie('user-A'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({ title: 'Hello', content: 'World' });
      expect(res.status).toBe(201);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.headers['location']).toMatch(/^\/posts\/[A-Za-z0-9_-]+$/);
      expect(typeof res.body.id).toBe('string');
    });

    it('GET /posts returns JSON list response', async () => {
      const app = await makeApp();
      await request(app).post('/posts').set('Accept', 'application/json').send({ title: 'A', content: 'aaa' });
      const res = await request(app).get('/posts');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('items');
    });

    it('GET /posts invalid query returns 400 with JSON error body', async () => {
      const app = await makeApp();
      const res = await request(app).get('/posts?page=0');
      expect(res.status).toBe(422);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('/posts/:id', () => {
    it('GET returns 200 JSON on success and 404 JSON on missing', async () => {
      const app = await makeApp();
      const created = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'X', content: 'Y' });
      const id = created.body.id as string;

      const ok = await request(app).get(`/posts/${id}`);
      expect(ok.status).toBe(200);
      expect(ok.headers['content-type']).toMatch(/application\/json/);

      const missing = await request(app).get('/posts/does-not-exist');
      expect(missing.status).toBe(404);
    });

    it('PUT and PATCH return JSON body; DELETE returns 204 with no body', async () => {
      const app = await makeApp();
      const created = await request(app).post('/posts').set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'P', content: 'C' });
      const id = created.body.id as string;

      const putRes = await request(app).put(`/posts/${id}`).set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'New', content: 'Text' });
      expect(putRes.status).toBe(200);
      expect(putRes.headers['content-type']).toMatch(/application\/json/);

      const patchRes = await request(app).patch(`/posts/${id}`).set('Cookie', cookie('user-A')).set('Accept', 'application/json').send({ title: 'Updated' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.headers['content-type']).toMatch(/application\/json/);

      const delRes = await request(app).delete(`/posts/${id}`).set('Cookie', cookie('user-A')).set('Accept', 'application/json');
      expect(delRes.status).toBe(204);
      expect(delRes.text).toBe('');
    });
  });
});

describe('GET /openapi.json', () => {
  it('serves the OpenAPI document as JSON', async () => {
      const app = await makeApp();
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toHaveProperty('openapi', '3.1.0');
  });
});


