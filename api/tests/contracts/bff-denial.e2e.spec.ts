import { describe, it, expect, beforeAll } from '@jest/globals';
import { createHmac } from 'node:crypto';
import request, { Test, Response } from 'supertest';
import { createApp } from '../../src/app';
import { loadConfigFromEnv } from '../../src/config';
import type { IPostsRepository } from '../../src/repositories/posts.repository';
import { createRepository } from '../../src/repositories/posts-repository';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Application } from 'express';

const TEST_SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
process.env.SESSION_SECRET = TEST_SESSION_SECRET;

type MakeAppOptions = {
  rateLimitMax?: number;
  repository?: IPostsRepository;
};

async function makeApp(options: MakeAppOptions = {}) {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: options.rateLimitMax ?? 1000 };
  const repository = options.repository ?? (await createRepository());
  const app = createApp(config, repository);
  return { app, repository };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function makeSessionCookie(userId: string, role: string = 'owner'): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
  );
  const signature = base64url(
    createHmac('sha256', TEST_SESSION_SECRET).update(`${header}.${payload}`).digest(),
  );
  return `session=${header}.${payload}.${signature}`;
}

function makeFirebaseToken(userId: string, role: string = 'owner'): string {
  // Create a mock Firebase ID token for testing
  const header = base64url(
    JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
      kid: 'test-key-id',
    }),
  );
  const payload = base64url(
    JSON.stringify({
      iss: 'https://securetoken.google.com/test-project',
      aud: 'test-project',
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      role: role,
    }),
  );
  const signature = base64url(Buffer.from('fake-firebase-signature'));
  return `${header}.${payload}.${signature}`;
}

function buildRepository(overrides: Partial<IPostsRepository>): IPostsRepository {
  const notImplemented = async () => {
    throw new Error('Not implemented in test stub');
  };

  return {
    create: overrides.create ?? (async (_post) => notImplemented()),
    getById: overrides.getById ?? (async (_id) => null),
    list: overrides.list ?? (async (_page, _pageSize) => ({ items: [], totalItems: 0 })),
    replace: overrides.replace ?? (async (_id, _post) => false),
    update: overrides.update ?? (async (_id, _partial) => null),
    delete: overrides.delete ?? (async (_id) => false),
    count: overrides.count ?? (async () => 0),
  };
}

function saveTestOutput(testName: string, request: Test, response: Response): void {
  const outputDir = 'packet/contracts/bff-denial';
  mkdirSync(outputDir, { recursive: true });

  const output = {
    test: testName,
    timestamp: new Date().toISOString(),
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
    },
    response: {
      status: response.status,
      headers: response.headers,
      body: response.body,
    },
  };

  const filename = join(outputDir, `${testName.replace(/\s+/g, '-')}.json`);
  writeFileSync(filename, JSON.stringify(output, null, 2));
}

describe('Direct-API Denial E2E Tests (T077)', () => {
  let app: Application;

  beforeAll(async () => {
    const { app: testApp } = await makeApp();
    app = testApp;
  });

  describe('Direct API calls should be denied', () => {
    it('POST /posts with valid bearer token but no CSRF should return 401 (unauthorized)', async () => {
      const firebaseToken = makeFirebaseToken('test-user-123', 'owner');
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${firebaseToken}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          title: 'Direct API Call Test',
          content: 'This should be rejected because it bypasses the BFF',
        });

      expect(res.status).toBe(401);
      expect(String(res.body.code).toUpperCase()).toBe('UNAUTHORIZED');

      saveTestOutput(
        'direct-api-bearer-no-csrf',
        {
          method: 'POST',
          url: '/posts',
          headers: { Authorization: `Bearer ${firebaseToken}` },
          body: {
            title: 'Direct API Call Test',
            content: 'This should be rejected because it bypasses the BFF',
          },
        },
        res,
      );
    });

    it('PUT /posts with valid bearer token but no CSRF should return 401 (unauthorized)', async () => {
      const firebaseToken = makeFirebaseToken('test-user-123', 'owner');
      const res = await request(app)
        .put('/posts/test-post-123')
        .set('Authorization', `Bearer ${firebaseToken}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          title: 'Updated via Direct API',
          content: 'This should be rejected',
        });

      expect(res.status).toBe(401);
      expect(String(res.body.code).toUpperCase()).toBe('UNAUTHORIZED');

      saveTestOutput(
        'direct-api-bearer-no-csrf-put',
        {
          method: 'PUT',
          url: '/posts/test-post-123',
          headers: { Authorization: `Bearer ${firebaseToken}` },
          body: {
            title: 'Updated via Direct API',
            content: 'This should be rejected',
          },
        },
        res,
      );
    });

    it('DELETE /posts with valid bearer token but no CSRF should return 401 (unauthorized)', async () => {
      const firebaseToken = makeFirebaseToken('test-user-123', 'owner');
      const res = await request(app)
        .delete('/posts/test-post-123')
        .set('Authorization', `Bearer ${firebaseToken}`)
        .set('Accept', 'application/json');

      expect(res.status).toBe(401);
      expect(String(res.body.code).toUpperCase()).toBe('UNAUTHORIZED');

      saveTestOutput(
        'direct-api-bearer-no-csrf-delete',
        {
          method: 'DELETE',
          url: '/posts/test-post-123',
          headers: { Authorization: `Bearer ${firebaseToken}` },
        },
        res,
      );
    });

    it('POST /posts with CSRF token but no identity headers should return 403', async () => {
      const repository = buildRepository({
        create: async () => {
          throw new Error('Repository should not be called when identity validation fails');
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        // Missing identity headers - should be rejected
        .send({
          title: 'BFF Call Without Identity Headers',
          content: 'This should be rejected because BFF did not forward identity',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Missing identity propagation headers');

      saveTestOutput(
        'direct-api-csrf-no-identity',
        {
          method: 'POST',
          url: '/posts',
          headers: {
            Cookie: makeSessionCookie('test-user-123', 'owner'),
            'X-CSRF-Token': 'valid-csrf-token',
          },
          body: {
            title: 'BFF Call Without Identity Headers',
            content: 'This should be rejected because BFF did not forward identity',
          },
        },
        res,
      );
    });

    it('PUT /posts with CSRF token but mismatched identity headers should return 403', async () => {
      const repository = buildRepository({
        replace: async () => {
          throw new Error('Repository should not be called when identity validation fails');
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const res = await request(testApp)
        .put('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'different-user-456') // Mismatched user ID
        .set('X-User-Role', 'owner')
        .send({
          title: 'Updated with Wrong Identity',
          content: 'This should be rejected',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Identity header does not match authenticated user');

      saveTestOutput(
        'direct-api-csrf-mismatched-identity',
        {
          method: 'PUT',
          url: '/posts/test-post-123',
          headers: {
            Cookie: makeSessionCookie('test-user-123', 'owner'),
            'X-CSRF-Token': 'valid-csrf-token',
            'X-User-Id': 'different-user-456',
            'X-User-Role': 'owner',
          },
          body: {
            title: 'Updated with Wrong Identity',
            content: 'This should be rejected',
          },
        },
        res,
      );
    });

    it('DELETE /posts with CSRF token but mismatched role should return 403', async () => {
      const repository = buildRepository({
        delete: async () => {
          throw new Error('Repository should not be called when identity validation fails');
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const res = await request(testApp)
        .delete('/posts/test-post-123')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'admin'); // Mismatched role
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Identity header does not match authenticated user role');

      saveTestOutput(
        'direct-api-csrf-mismatched-role',
        {
          method: 'DELETE',
          url: '/posts/test-post-123',
          headers: {
            Cookie: makeSessionCookie('test-user-123', 'owner'),
            'X-CSRF-Token': 'valid-csrf-token',
            'X-User-Id': 'test-user-123',
            'X-User-Role': 'admin',
          },
        },
        res,
      );
    });

    it('POST /posts with valid BFF identity headers should work', async () => {
      const repository = buildRepository({
        create: async (post) => {
          expect(post.ownerId).toBe('test-user-123');
          return {
            id: 'bff-post-123',
            ownerId: 'test-user-123',
            title: 'Valid BFF Call',
            content: 'This should work because BFF forwarded identity correctly',
            tags: [],
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123') // Correct identity
        .set('X-User-Role', 'owner')
        .send({
          title: 'Valid BFF Call',
          content: 'This should work because BFF forwarded identity correctly',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.ownerId).toBe('test-user-123');

      saveTestOutput(
        'valid-bff-identity-headers',
        {
          method: 'POST',
          url: '/posts',
          headers: {
            Cookie: makeSessionCookie('test-user-123', 'owner'),
            'X-CSRF-Token': 'valid-csrf-token',
            'X-User-Id': 'test-user-123',
            'X-User-Role': 'owner',
          },
          body: {
            title: 'Valid BFF Call',
            content: 'This should work because BFF forwarded identity correctly',
          },
        },
        res,
      );
    });

    it('PUT /posts with valid BFF identity headers should work', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'test-user-123',
              title: 'Original Title',
              content: 'Original Content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          return null;
        },
        replace: async (id, post) => {
          expect(id).toBe('test-post-123');
          expect(post.ownerId).toBe('test-user-123');
          return true;
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const res = await request(testApp)
        .put('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123') // Correct identity
        .set('X-User-Role', 'owner')
        .send({
          title: 'Updated via Valid BFF',
          content: 'This should work',
        });

      expect(res.status).toBe(200);

      saveTestOutput(
        'valid-bff-identity-headers-put',
        {
          method: 'PUT',
          url: '/posts/test-post-123',
          headers: {
            Cookie: makeSessionCookie('test-user-123', 'owner'),
            'X-CSRF-Token': 'valid-csrf-token',
            'X-User-Id': 'test-user-123',
            'X-User-Role': 'owner',
          },
          body: {
            title: 'Updated via Valid BFF',
            content: 'This should work',
          },
        },
        res,
      );
    });

    it('DELETE /posts with valid BFF identity headers should work', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'test-user-123',
              title: 'Post to Delete',
              content: 'Content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          return null;
        },
        delete: async (id) => {
          expect(id).toBe('test-post-123');
          return true;
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const res = await request(testApp)
        .delete('/posts/test-post-123')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123') // Correct identity
        .set('X-User-Role', 'owner');

      expect(res.status).toBe(204);

      saveTestOutput(
        'valid-bff-identity-headers-delete',
        {
          method: 'DELETE',
          url: '/posts/test-post-123',
          headers: {
            Cookie: makeSessionCookie('test-user-123', 'owner'),
            'X-CSRF-Token': 'valid-csrf-token',
            'X-User-Id': 'test-user-123',
            'X-User-Role': 'owner',
          },
        },
        res,
      );
    });
  });

  describe('Error response format', () => {
    it('all denial responses include requestId in envelope', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer fake-token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('X-Request-Id', 'test-request-123')
        .send({
          title: 'Test',
          content: 'Test content',
        });

      expect(res.status).toBe(401);
      expect(res.body.requestId).toBe('test-request-123');
      expect(String(res.body.code).toUpperCase()).toBe('UNAUTHORIZED');
      expect(res.body.message).toBeDefined();
    });

    it('all denial responses set Cache-Control: no-store', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer fake-token')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          title: 'Test',
          content: 'Test content',
        });

      expect(res.status).toBe(401);
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('BFF bypass prevention', () => {
    it('prevents direct API calls with Firebase tokens', async () => {
      const firebaseToken = makeFirebaseToken('firebase-user-123', 'owner');
      const { app } = await makeApp();

      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${firebaseToken}`)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          title: 'Firebase Direct Call',
          content: 'This should be rejected as it bypasses BFF',
        });

      expect(res.status).toBe(401);
      expect(String(res.body.code).toUpperCase()).toBe('UNAUTHORIZED');
    });

    it('prevents direct API calls with session cookies only (requires identity headers on writes)', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .post('/posts')
        .set('Cookie', makeSessionCookie('cookie-user-123', 'owner'))
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({
          title: 'Cookie Direct Call',
          content: 'This should be rejected as it bypasses BFF',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Missing identity propagation headers');
    });

    it('allows public GET requests without authentication', async () => {
      const { app } = await makeApp();

      const res = await request(app).get('/posts');

      // Should work for public endpoints
      expect([200, 404, 429]).toContain(res.status);
    });

    it('allows GET /health without authentication', async () => {
      const { app } = await makeApp();

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.service).toBe('api');
    });
  });
});
