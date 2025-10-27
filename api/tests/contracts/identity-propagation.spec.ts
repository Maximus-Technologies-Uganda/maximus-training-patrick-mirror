import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app';
import { loadConfigFromEnv } from '../../src/config';
import type { IPostsRepository } from '../../src/repositories/posts.repository';
import { createRepository } from '../../src/repositories/posts-repository';

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
    crypto.createHmac('sha256', TEST_SESSION_SECRET).update(`${header}.${payload}`).digest()
  );
  return `session=${header}.${payload}.${signature}`;
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

describe('BFF→API Identity Propagation (T053)', () => {
  it('accepts request when identity headers match authenticated user', async () => {
    const repository = buildRepository({
      create: async (post) => {
        // Verify the identity headers were properly validated
        expect(post.ownerId).toBe('test-user-123');
        return {
          id: 'test-post-123',
          ownerId: 'test-user-123',
          title: 'Test Post',
          content: 'Test content',
          tags: [],
          published: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'test-user-123')
      .set('X-User-Role', 'owner')
      .send({
        title: 'Test Post',
        content: 'Test content with enough length to pass validation'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toEqual(expect.any(String));
  });

  it('rejects request when identity headers do not match authenticated user', async () => {
    const repository = buildRepository({
      create: async () => {
        // This should not be called if identity validation works
        throw new Error('Repository should not be called when identity validation fails');
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'different-user-456') // Different user ID
      .set('X-User-Role', 'owner')
      .send({
        title: 'Test Post',
        content: 'Test content with enough length to pass validation'
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(res.body.message).toBe('Identity header does not match authenticated user');
  });

  it('rejects request when role header does not match authenticated user', async () => {
    const repository = buildRepository({
      create: async () => {
        throw new Error('Repository should not be called when identity validation fails');
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'test-user-123')
      .set('X-User-Role', 'admin') // Different role
      .send({
        title: 'Test Post',
        content: 'Test content with enough length to pass validation'
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(res.body.message).toBe('Identity header does not match authenticated user role');
  });

  it('rejects request when identity headers present but no authentication (401)', async () => {
    const repository = buildRepository({
      create: async () => {
        throw new Error('Repository should not be called when no authentication');
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'test-user-123')
      .set('X-User-Role', 'owner')
      .send({
        title: 'Test Post',
        content: 'Test content with enough length to pass validation'
      });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
    expect(res.body.message).toBe('Invalid or expired authentication token');
  });

  it('accepts request when no identity headers and no authentication (for public endpoints)', async () => {
    const { app } = await makeApp();

    const res = await request(app)
      .get('/posts');

    // Should work for public endpoints (no auth required)
    expect([200, 404, 429]).toContain(res.status); // 404 if no posts, 429 if rate limited, but not 403
  });

  it('rejects request when authenticated but no identity headers (writes require propagation)', async () => {
    const repository = buildRepository({
      create: async (post) => {
        throw new Error('Repository should not be called when identity headers are missing');
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
      .set('X-CSRF-Token', 'valid-csrf-token')
      // No identity headers - should be rejected
      .send({
        title: 'Test Post',
        content: 'Test content with enough length to pass validation'
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(res.body.message).toBe('Missing identity propagation headers');
  });

  it('validates identity for PUT requests', async () => {
    const repository = buildRepository({
      replace: async (id, post) => {
        throw new Error('Repository should not be called when identity validation fails');
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .put('/posts/test-post-123')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'different-user-456') // Wrong user
      .set('X-User-Role', 'owner')
      .send({
        title: 'Updated Post',
        content: 'Updated content with enough length'
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('validates identity for DELETE requests', async () => {
    const repository = buildRepository({
      delete: async () => {
        throw new Error('Repository should not be called when identity validation fails');
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .delete('/posts/test-post-123')
      .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
      .set('Accept', 'application/json')
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'different-user-456') // Wrong user
      .set('X-User-Role', 'owner');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('validates identity for PATCH requests', async () => {
    const repository = buildRepository({
      update: async () => {
        throw new Error('Repository should not be called when identity validation fails');
      },
    });

    const { app } = await makeApp({ repository });

    const res = await request(app)
      .patch('/posts/test-post-123')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'different-user-456') // Wrong user
      .set('X-User-Role', 'owner')
      .send({
        title: 'Updated Post'
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('includes requestId in error responses', async () => {
    const { app } = await makeApp();

    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('X-CSRF-Token', 'valid-csrf-token')
      .set('X-User-Id', 'test-user-123') // Identity headers without auth
      .set('X-User-Role', 'owner')
      .set('X-Request-Id', 'test-request-123')
      .send({
        title: 'Test Post',
        content: 'Test content with enough length to pass validation'
      });

    expect(res.status).toBe(401);
    expect(res.body.requestId).toBe('test-request-123');
  });
});
