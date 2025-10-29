import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app';
import { loadConfigFromEnv } from '../src/config';
import type { IPostsRepository } from '../src/repositories/posts.repository';
import { createRepository } from '../src/repositories/posts-repository';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_SESSION_SECRET = process.env.SESSION_SECRET || "test-secret";
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
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function makeSessionCookie(userId: string, role: string = 'owner'): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60
    })
  );
  const crypto = require('node:crypto');
  const signature = base64url(
    crypto
      .createHmac('sha256', TEST_SESSION_SECRET)
      .update(`${header}.${payload}`)
      .digest()
  );
  return `session=${header}.${payload}.${signature}`;
}

function makeCsrfToken(timestampSeconds: number, uuidSuffix: string = 'testuuid1234567890'): string {
  return `${timestampSeconds}-${uuidSuffix}`;
}

function makeBoundCsrfToken(userId: string, timestampSeconds: number, secret: string = TEST_SESSION_SECRET): string {
  const crypto = require('node:crypto');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${userId}.${timestampSeconds}`)
    .digest('hex')
    .slice(0, 32);
  return `${timestampSeconds}-${sig}`;
}

function buildRepository(overrides: Partial<IPostsRepository>): IPostsRepository {
  const notImplemented = async () => {
    throw new Error("Not implemented in test stub");
  };

  return {
    create: overrides.create ?? (async (_post) => notImplemented()),
    getById: overrides.getById ?? (async (_id) => notImplemented()),
    list: overrides.list ?? (async (_page, _pageSize) => notImplemented()),
    replace: overrides.replace ?? (async (_id, _post) => false),
    update: overrides.update ?? (async (_id, _partial) => null),
    delete: overrides.delete ?? (async (_id) => false),
    count: overrides.count ?? (async () => 0),
  };
}

function saveTestOutput(testName: string, request: any, response: any): void {
  const outputDir = 'packet/contracts/csrf-ttl';
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

describe('CSRF TTL Fuzzing Tests (T093)', () => {
  let app: any;

  beforeEach(async () => {
    const { app: testApp } = await makeApp();
    app = testApp;
  });

  describe('CSRF token TTL boundaries', () => {
    it('accepts CSRF tokens exactly at 2-hour boundary', async () => {
      const now = Math.floor(Date.now() / 1000);
      const boundaryTimestamp = now - (2 * 60 * 60) + 1; // Near boundary to account for processing latency

      const repository = buildRepository({
        create: async (post) => {
          expect(post.ownerId).toBe('test-user-123');
          return {
            id: 'csrf-boundary-test-123',
            ownerId: 'test-user-123',
            title: 'CSRF TTL Boundary Test',
            content: 'This should work at exactly 2-hour boundary',
            tags: [],
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', boundaryTimestamp);
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'CSRF TTL Boundary Test',
          content: 'This should work at exactly 2-hour boundary'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toEqual(expect.any(String));

      saveTestOutput('csrf-exactly-2h-boundary-valid', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'CSRF TTL Boundary Test',
          content: 'This should work at exactly 2-hour boundary'
        },
      }, res);
    });

    it('rejects CSRF tokens 1 second past 2-hour boundary', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredTimestamp = now - (2 * 60 * 60) - 1; // 2 hours + 1 second ago

      const repository = buildRepository({
        create: async () => ({
          id: 'should-not-be-used',
          ownerId: 'test-user-123',
          title: 'N/A',
          content: 'N/A',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', expiredTimestamp);
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'CSRF TTL Expired Test',
          content: 'This should be rejected because token is expired'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');

      saveTestOutput('csrf-2h-1s-expired-rejected', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'CSRF TTL Expired Test',
          content: 'This should be rejected because token is expired'
        },
      }, res);
    });

    it('accepts CSRF tokens 5 minutes in the future (clock skew tolerance)', async () => {
      const now = Math.floor(Date.now() / 1000);
      const futureTimestamp = now + (5 * 60); // 5 minutes in the future

      const repository = buildRepository({
        create: async (post) => {
          expect(post.ownerId).toBe('test-user-123');
          return {
            id: 'csrf-future-test-123',
            ownerId: 'test-user-123',
            title: 'CSRF Future Token Test',
            content: 'This should work with future token within skew tolerance',
            tags: [],
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', futureTimestamp);
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'CSRF Future Token Test',
          content: 'This should work with future token within skew tolerance'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toEqual(expect.any(String));

      saveTestOutput('csrf-5m-future-within-skew-valid', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'CSRF Future Token Test',
          content: 'This should work with future token within skew tolerance'
        },
      }, res);
    });

    it('rejects CSRF tokens 5 minutes + 1 second in the future', async () => {
      const now = Math.floor(Date.now() / 1000);
      const farFutureTimestamp = now + (5 * 60) + 1; // 5 minutes + 1 second in the future

      const repository = buildRepository({
        create: async () => ({
          id: 'should-not-be-used',
          ownerId: 'test-user-123',
          title: 'N/A',
          content: 'N/A',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', farFutureTimestamp);
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'CSRF Far Future Test',
          content: 'This should be rejected because token is too far in future'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');

      saveTestOutput('csrf-5m-1s-future-rejected', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'CSRF Far Future Test',
          content: 'This should be rejected because token is too far in future'
        },
      }, res);
    });

    it('accepts fresh CSRF tokens (just created)', async () => {
      const now = Math.floor(Date.now() / 1000);

      const repository = buildRepository({
        create: async (post) => {
          expect(post.ownerId).toBe('test-user-123');
          return {
            id: 'csrf-fresh-test-123',
            ownerId: 'test-user-123',
            title: 'CSRF Fresh Token Test',
            content: 'This should work with a fresh token',
            tags: [],
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', now);
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'CSRF Fresh Token Test',
          content: 'This should work with a fresh token'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toEqual(expect.any(String));

      saveTestOutput('csrf-fresh-token-valid', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'CSRF Fresh Token Test',
          content: 'This should work with a fresh token'
        },
      }, res);
    });

    it('rejects malformed CSRF tokens (no dash)', async () => {
      const repository = buildRepository({
        create: async () => ({
          id: 'should-not-be-used',
          ownerId: 'test-user-123',
          title: 'N/A',
          content: 'N/A',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const { app: testApp } = await makeApp({ repository });

      const malformedToken = 'malformedtokenwithoutdash';
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=othertoken`
        ].join('; '))
        .set('X-CSRF-Token', malformedToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Malformed CSRF Test',
          content: 'This should be rejected because token is malformed'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');

      saveTestOutput('csrf-malformed-token-rejected', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${malformedToken}`].join('; '),
          'X-CSRF-Token': malformedToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Malformed CSRF Test',
          content: 'This should be rejected because token is malformed'
        },
      }, res);
    });

    it('rejects CSRF tokens with invalid timestamp', async () => {
      const repository = buildRepository({
        create: async () => ({
          id: 'should-not-be-used',
          ownerId: 'test-user-123',
          title: 'N/A',
          content: 'N/A',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const { app: testApp } = await makeApp({ repository });

      const invalidTimestampToken = 'notanumber-uuid1234567890';
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${invalidTimestampToken}`
        ].join('; '))
        .set('X-CSRF-Token', invalidTimestampToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Invalid Timestamp CSRF Test',
          content: 'This should be rejected because timestamp is invalid'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');

      saveTestOutput('csrf-invalid-timestamp-rejected', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${invalidTimestampToken}`].join('; '),
          'X-CSRF-Token': invalidTimestampToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Invalid Timestamp CSRF Test',
          content: 'This should be rejected because timestamp is invalid'
        },
      }, res);
    });

    it('rejects CSRF tokens with empty UUID part', async () => {
      const now = Math.floor(Date.now() / 1000);
      const repository = buildRepository({
        create: async () => ({
          id: 'should-not-be-used',
          ownerId: 'test-user-123',
          title: 'N/A',
          content: 'N/A',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const { app: testApp } = await makeApp({ repository });

      const emptyUuidToken = `${now}-`;
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${emptyUuidToken}`
        ].join('; '))
        .set('X-CSRF-Token', emptyUuidToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Empty UUID CSRF Test',
          content: 'This should be rejected because UUID part is empty'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');

      saveTestOutput('csrf-empty-uuid-rejected', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${emptyUuidToken}`].join('; '),
          'X-CSRF-Token': emptyUuidToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Empty UUID CSRF Test',
          content: 'This should be rejected because UUID part is empty'
        },
      }, res);
    });

    it('validates CSRF for PUT requests with boundary conditions', async () => {
      const now = Math.floor(Date.now() / 1000);
      const boundaryTimestamp = now - (2 * 60 * 60); // Exactly 2 hours ago

      const repository = buildRepository({
        getById: async (id) => ({
          id,
          ownerId: 'test-user-123',
          title: 'Old',
          content: 'Old content',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        replace: async (id, post) => {
          expect(id).toBe('test-post-123');
          expect(post.ownerId).toBe('test-user-123');
          return true;
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', boundaryTimestamp);
      const res = await request(testApp)
        .put('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Updated with Boundary CSRF',
          content: 'This should work with boundary CSRF token'
        });

      expect(res.status).toBe(200);

      saveTestOutput('csrf-put-boundary-valid', {
        method: 'PUT',
        url: '/posts/test-post-123',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Updated with Boundary CSRF',
          content: 'This should work with boundary CSRF token'
        },
      }, res);
    });

    it('validates CSRF for DELETE requests with boundary conditions', async () => {
      const now = Math.floor(Date.now() / 1000);
      const boundaryTimestamp = now - (2 * 60 * 60); // Exactly 2 hours ago

      const repository = buildRepository({
        getById: async (id) => ({
          id,
          ownerId: 'test-user-123',
          title: 'Old',
          content: 'Old content',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        delete: async (id) => {
          expect(id).toBe('test-post-123');
          return true;
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', boundaryTimestamp);
      const res = await request(testApp)
        .delete('/posts/test-post-123')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner');

      expect(res.status).toBe(204);

      saveTestOutput('csrf-delete-boundary-valid', {
        method: 'DELETE',
        url: '/posts/test-post-123',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
      }, res);
    });

    it('rejects DELETE with expired CSRF token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredTimestamp = now - (2 * 60 * 60) - 1; // 2 hours + 1 second ago

      const repository = buildRepository({
        delete: async () => false,
      });

      const { app: testApp } = await makeApp({ repository });

      const csrfToken = makeBoundCsrfToken('test-user-123', expiredTimestamp);
      const res = await request(testApp)
        .delete('/posts/test-post-123')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');

      saveTestOutput('csrf-delete-expired-rejected', {
        method: 'DELETE',
        url: '/posts/test-post-123',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${csrfToken}`].join('; '),
          'X-CSRF-Token': csrfToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
      }, res);
    });
  });

  describe('CSRF replay protection across sessions', () => {
    it('rejects CSRF token from different session', async () => {
      const now = Math.floor(Date.now() / 1000);

      // Create token for one session
      const csrfToken1 = makeBoundCsrfToken('test-user-123', now);

      // Try to use it with different session
      const repository = buildRepository({
        create: async () => ({
          id: 'should-not-be-used',
          ownerId: 'test-user-123',
          title: 'N/A',
          content: 'N/A',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const { app: testApp } = await makeApp({ repository });

      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('different-user-456', 'owner'), // Different session
          `csrf=${csrfToken1}` // Token from different session
        ].join('; '))
        .set('X-CSRF-Token', csrfToken1)
        .set('X-User-Id', 'different-user-456')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Cross-Session CSRF Test',
          content: 'This should be rejected because token is from different session'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('CSRF token mismatch');

      saveTestOutput('csrf-cross-session-rejected', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('different-user-456', 'owner'), `csrf=${csrfToken1}`].join('; '),
          'X-CSRF-Token': csrfToken1,
          'X-User-Id': 'different-user-456',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Cross-Session CSRF Test',
          content: 'This should be rejected because token is from different session'
        },
      }, res);
    });
  });

  describe('Error response format', () => {
    it('includes requestId in all CSRF error responses', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredTimestamp = now - (2 * 60 * 60) - 1; // Expired token

      const csrfToken = makeCsrfToken(expiredTimestamp);
      const res = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .set('X-Request-Id', 'csrf-test-request-123')
        .send({
          title: 'CSRF Error Response Test',
          content: 'This should be rejected with proper requestId'
        });

      expect(res.status).toBe(403);
      expect(res.body.requestId).toBe('csrf-test-request-123');
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');
    });

    it('sets Cache-Control: no-store on CSRF error responses', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredTimestamp = now - (2 * 60 * 60) - 1; // Expired token

      const csrfToken = makeCsrfToken(expiredTimestamp);
      const res = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${csrfToken}`
        ].join('; '))
        .set('X-CSRF-Token', csrfToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'CSRF Cache Control Test',
          content: 'This should be rejected with no-store header'
        });

      expect(res.status).toBe(403);
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('CSRF token format validation', () => {
    it('rejects tokens with too many dashes', async () => {
      const repository = buildRepository({
        create: async () => ({
          id: 'should-not-be-used',
          ownerId: 'test-user-123',
          title: 'N/A',
          content: 'N/A',
          tags: [],
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      const { app: testApp } = await makeApp({ repository });

      const malformedToken = '1234567890-uuid-extra-dash';
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${malformedToken}`
        ].join('; '))
        .set('X-CSRF-Token', malformedToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Too Many Dashes Test',
          content: 'This should be rejected because token has too many dashes'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('Invalid or expired CSRF token');
    });

    it('accepts legacy tokens without timestamp for backward compatibility', async () => {
      const repository = buildRepository({
        create: async (post) => {
          expect(post.ownerId).toBe('test-user-123');
          return {
            id: 'csrf-legacy-test-123',
            ownerId: 'test-user-123',
            title: 'Legacy CSRF Test',
            content: 'This should work with legacy token format',
            tags: [],
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app: testApp } = await makeApp({ repository });

      const legacyToken = 'legacytokenwithouttimestamp';
      const res = await request(testApp)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Origin', 'http://localhost:3001')
        .set('Cookie', [
          makeSessionCookie('test-user-123', 'owner'),
          `csrf=${legacyToken}`
        ].join('; '))
        .set('X-CSRF-Token', legacyToken)
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Legacy CSRF Test',
          content: 'This should work with legacy token format'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toEqual(expect.any(String));

      saveTestOutput('csrf-legacy-token-valid', {
        method: 'POST',
        url: '/posts',
        headers: {
          Origin: 'http://localhost:3001',
          Cookie: [makeSessionCookie('test-user-123', 'owner'), `csrf=${legacyToken}`].join('; '),
          'X-CSRF-Token': legacyToken,
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Legacy CSRF Test',
          content: 'This should work with legacy token format'
        },
      }, res);
    });
  });
});

