import supertest from "supertest";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { validToken } = require('./jwt.util.js');
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
const cookie = (u: string) => `session=${validToken(u)}`;
import * as appModule from "#tsApp";
// jest-openapi now initialised globally via tests/jest.setup.js

import type { Express } from "express";
import type { AppConfig } from "../src/config";
import type { IPostsRepository } from "../src/repositories/posts.repository";
import { createApp as createAppFactory } from "../src/app";
import { loadConfigFromEnv } from "../src/config";
import { createRepository } from "../src/repositories/posts-repository";

async function resolveApp(): Promise<Express> {
  const mod = appModule as unknown as {
    default?: Express;
    app?: Express;
    createApp?: (config: AppConfig, repository: IPostsRepository) => Express;
  };
  if (mod.default && typeof mod.default.use === "function") return mod.default;
  if (mod.app && typeof mod.app.use === "function") return mod.app;
  if (typeof mod.createApp === 'function') {
    const base = loadConfigFromEnv();
    const config: AppConfig = { ...base, rateLimitMax: 1000 };
    const repository = (await createRepository()) as IPostsRepository;
    return mod.createApp(config, repository);
  }
  throw new Error('Unable to resolve Express app from ../src/app');
}

describe('Posts API Integration Tests', () => {
  describe('GET /posts', () => {
    it('should return a paginated response object', async () => {
      const api = await resolveApp();

      // Seed a few posts
      const payloads = [
        { title: 'P1', content: 'Content for P1 post' },
        { title: 'P2', content: 'Content for P2 post' },
        { title: 'P3', content: 'Content for P3 post' },
      ];
      for (const p of payloads) {
        const res = await supertest(api)
          .post('/posts')
          .set('Cookie', cookie('user-A'))
          .send(p)
          .set('Content-Type', 'application/json');
        expect(res.status).toBe(201);
      }

      const res = await supertest(api).get('/posts').query({ page: 1, pageSize: 2 });
      expect(res.status).toBe(200);
      const body = res.body;
      expect(typeof body).toBe('object');
      expect(Array.isArray(body.items)).toBe(true);
      expect(typeof body.totalItems).toBe('number');
      expect(typeof body.totalPages).toBe('number');
      expect(typeof body.currentPage).toBe('number');
      expect(typeof body.hasNextPage).toBe('boolean');
      expect(body.currentPage).toBe(1);
      expect(body.items.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /health', () => {
    it('should respond with 200 and { status: "ok" }', async () => {
      const api = await resolveApp();
      const res = await supertest(api).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /posts', () => {
    it('should return a 4xx client error for invalid input', async () => {
      const api = await resolveApp();
      const res = await supertest(api)
        .post('/posts')
        .send({})
        .set('Content-Type', 'application/json');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should handle the full CRUD lifecycle of a post', async () => {
      const api = await resolveApp();
      // CREATE
      const createPayload = { title: 'Integration Title', content: 'This is the integration test content.' };
      const createRes = await supertest(api)
        .post('/posts')
        .set('Cookie', cookie('user-A'))
        .send(createPayload)
        .set('Content-Type', 'application/json');
      expect(createRes.status).toBe(201);
      expect(createRes.headers['location']).toMatch(/^\/posts\/[A-Za-z0-9_-]+$/);
      expect(typeof createRes.body.id).toBe('string');
      const id: string = createRes.body.id;

      // READ
      const getRes1 = await supertest(api).get(`/posts/${id}`);
      expect(getRes1.status).toBe(200);
      expect(getRes1.body).toMatchObject({ id, ...createPayload });

      // UPDATE
      const patchPayload = { content: 'This content has been updated by the integration test.' };
      const patchRes = await supertest(api)
        .patch(`/posts/${id}`)
        .set('Cookie', cookie('user-A'))
        .send(patchPayload)
        .set('Content-Type', 'application/json');
      expect(patchRes.status).toBe(200);
      expect(patchRes.body).toMatchObject({ id, ...createPayload, ...patchPayload });

      // VERIFY UPDATE
      const getRes2 = await supertest(api).get(`/posts/${id}`);
      expect(getRes2.status).toBe(200);
      expect(getRes2.body).toMatchObject({ id, ...createPayload, ...patchPayload });

      // DELETE
      const deleteRes = await supertest(api).delete(`/posts/${id}`).set('Cookie', cookie('user-A'));
      expect(deleteRes.status).toBe(204);

      // VERIFY DELETE
      const getRes3 = await supertest(api).get(`/posts/${id}`);
      expect(getRes3.status).toBe(404);
    });

    it('should return a 4xx error for requests with unknown fields', async () => {
      const api = await resolveApp();
      const payload = {
        title: 'Valid Title',
        content: 'Valid content for the post.',
        unknownField: 'test',
      };

      const res = await supertest(api)
        .post('/posts')
        .send(payload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should return a 429 Too Many Requests error after exceeding the limit', async () => {
      // Build an app instance with the default limiter threshold (100)
      // using the JS factory to avoid TS module resolution issues in tests.
       
      const base = loadConfigFromEnv();
      const config: AppConfig = { ...base, rateLimitMax: 100, rateLimitWindowMs: 15 * 60 * 1000 };
      const repository = (await createRepository()) as IPostsRepository;
      const api = createAppFactory(config, repository);

      // Fire requests sequentially to avoid race conditions in some CI environments
      for (let i = 0; i < 101; i++) {
         
        await supertest(api).get('/health');
      }
      const res = await supertest(api).get('/health');
      expect(res.status).toBe(429);
    });
  });
});


