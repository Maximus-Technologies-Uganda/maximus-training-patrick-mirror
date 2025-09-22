import supertest from 'supertest';
import * as appModule from '../src/app';

function getApp() {
  const mod: any = appModule as any;
  if (mod.default && typeof mod.default === 'function' && typeof mod.default.use === 'function') return mod.default;
  if (mod.app && typeof mod.app.use === 'function') return mod.app;
  if (typeof mod.createApp === 'function') {
    // Dynamically require JS modules to avoid TS type issues in tests
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { loadConfigFromEnv } = require('../src/config');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createRepository } = require('../src/repositories/posts-repository');
    const base = loadConfigFromEnv();
    const config = { ...base, rateLimitMax: 1000 } as any;
    const repository = createRepository();
    return mod.createApp(config, repository);
  }
  throw new Error('Unable to resolve Express app from ../src/app');
}

describe('Posts API Integration Tests', () => {
  describe('GET /health', () => {
    it('should respond with 200 and { status: "ok" }', async () => {
      const api = getApp();
      const res = await supertest(api).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('POST /posts', () => {
    it('should return a 4xx client error for invalid input', async () => {
      const api = getApp();
      const res = await supertest(api)
        .post('/posts')
        .send({})
        .set('Content-Type', 'application/json');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should handle the full CRUD lifecycle of a post', async () => {
      const api = getApp();
      // CREATE
      const createPayload = { title: 'Integration Title', content: 'This is the integration test content.' };
      const createRes = await supertest(api)
        .post('/posts')
        .send(createPayload)
        .set('Content-Type', 'application/json');
      expect(createRes.status).toBe(201);
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
        .send(patchPayload)
        .set('Content-Type', 'application/json');
      expect(patchRes.status).toBe(200);
      expect(patchRes.body).toMatchObject({ id, ...createPayload, ...patchPayload });

      // VERIFY UPDATE
      const getRes2 = await supertest(api).get(`/posts/${id}`);
      expect(getRes2.status).toBe(200);
      expect(getRes2.body).toMatchObject({ id, ...createPayload, ...patchPayload });

      // DELETE
      const deleteRes = await supertest(api).delete(`/posts/${id}`);
      expect(deleteRes.status).toBe(204);

      // VERIFY DELETE
      const getRes3 = await supertest(api).get(`/posts/${id}`);
      expect(getRes3.status).toBe(404);
    });
  });
});


