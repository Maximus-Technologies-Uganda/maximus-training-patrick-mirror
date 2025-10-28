import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
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
  const outputDir = 'packet/contracts/owner-mischief';
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

describe('Owner-Check Mischief Tests (T099)', () => {
  // Set up test hook to bypass Firebase Admin revocation checks
  beforeAll(() => {
    (global as any).__TEST_ADMIN_REVOCATION_HOOK__ = async () => {
      // Allow all admin operations in tests
      return { allowed: true };
    };
  });

  afterAll(() => {
    delete (global as any).__TEST_ADMIN_REVOCATION_HOOK__;
  });

  describe('Schema validation prevents ownerId injection', () => {
    it('POST /posts rejects request body with ownerId field (schema validation)', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Schema Validation Test',
          content: 'This should be rejected because ownerId is not allowed in request body',
          ownerId: 'malicious-user-456' // Attempted mischief
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toBe('Request validation failed');

      saveTestOutput('post-ownerid-schema-rejection', {
        method: 'POST',
        url: '/posts',
        headers: {
          Cookie: makeSessionCookie('test-user-123', 'owner'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Schema Validation Test',
          content: 'This should be rejected because ownerId is not allowed in request body',
          ownerId: 'malicious-user-456'
        },
      }, res);
    });

    it('PUT /posts rejects request body with ownerId field (schema validation)', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .put('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Updated Title',
          content: 'Updated content',
          ownerId: 'malicious-user-456' // Attempted mischief
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toBe('Request validation failed');

      saveTestOutput('put-ownerid-schema-rejection', {
        method: 'PUT',
        url: '/posts/test-post-123',
        headers: {
          Cookie: makeSessionCookie('test-user-123', 'owner'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Updated Title',
          content: 'Updated content',
          ownerId: 'malicious-user-456'
        },
      }, res);
    });

    it('PATCH /posts rejects request body with ownerId field (schema validation)', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .patch('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Patched Title',
          ownerId: 'malicious-user-456' // Attempted mischief
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toBe('Request validation failed');

      saveTestOutput('patch-ownerid-schema-rejection', {
        method: 'PATCH',
        url: '/posts/test-post-123',
        headers: {
          Cookie: makeSessionCookie('test-user-123', 'owner'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Patched Title',
          ownerId: 'malicious-user-456'
        },
      }, res);
    });
  });

  describe('Server-side owner resolution ignores client data', () => {
    it('POST /posts uses server-resolved userId as ownerId, ignoring any client attempts', async () => {
      const repository = buildRepository({
        create: async (post) => {
          // Verify that the server used the authenticated user, not any client-supplied value
          expect(post.ownerId).toBe('test-user-123');
          expect(post.ownerId).not.toBe('malicious-user-456');

          return {
            id: 'owner-mischief-test-123',
            ownerId: post.ownerId, // Should be the authenticated user
            title: post.title,
            content: post.content,
            tags: post.tags || [],
            published: post.published || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app } = await makeApp({ repository });

      // First try without any ownerId in body (should work)
      const res1 = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Server Owner Resolution Test',
          content: 'This should use the authenticated user as owner'
        });

      expect(res1.status).toBe(201);
      expect(res1.body.ownerId).toBe('test-user-123');
      expect(res1.body.ownerId).not.toBe('malicious-user-456');

      saveTestOutput('post-server-owner-resolution', {
        method: 'POST',
        url: '/posts',
        headers: {
          Cookie: makeSessionCookie('test-user-123', 'owner'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Server Owner Resolution Test',
          content: 'This should use the authenticated user as owner'
        },
      }, res1);
    });

    it('PUT /posts uses server authorization check, not client ownerId', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'original-owner-456', // Different from authenticated user
              title: 'Original Title',
              content: 'Original content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          throw new Error('Post not found');
        },
        replace: async (id, post) => {
          // This should be called because the authenticated user is an admin
          expect(id).toBe('test-post-123');
          return {
            id: 'test-post-123',
            ownerId: 'original-owner-456', // Should remain unchanged
            title: post.title,
            content: post.content,
            tags: post.tags || [],
            published: post.published || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app } = await makeApp({ repository });

      const res = await request(app)
        .put('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('admin-user-789', 'admin'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'admin-user-789')
        .set('X-User-Role', 'admin')
        .send({
          title: 'Updated by Admin',
          content: 'Admin should be able to update any post',
          ownerId: 'malicious-user-456' // Attempted mischief - should be ignored
        });

      expect(res.status).toBe(200);
      expect(res.body.ownerId).toBe('original-owner-456'); // Should remain original owner
      expect(res.body.ownerId).not.toBe('malicious-user-456');
      expect(res.body.ownerId).not.toBe('admin-user-789'); // Admin doesn't become owner

      saveTestOutput('put-admin-owner-unchanged', {
        method: 'PUT',
        url: '/posts/test-post-123',
        headers: {
          Cookie: makeSessionCookie('admin-user-789', 'admin'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'admin-user-789',
          'X-User-Role': 'admin'
        },
        body: {
          title: 'Updated by Admin',
          content: 'Admin should be able to update any post',
          ownerId: 'malicious-user-456'
        },
      }, res);
    });

    it('owner cannot update post they do not own, regardless of client claims', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'original-owner-456', // Different from authenticated user
              title: 'Original Title',
              content: 'Original content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          throw new Error('Post not found');
        },
        update: async () => {
          throw new Error('Repository should not be called when user is not authorized');
        },
      });

      const { app } = await makeApp({ repository });

      const res = await request(app)
        .patch('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Attempted Unauthorized Update',
          ownerId: 'original-owner-456' // Client tries to claim ownership
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');

      saveTestOutput('patch-owner-mischief-rejected', {
        method: 'PATCH',
        url: '/posts/test-post-123',
        headers: {
          Cookie: makeSessionCookie('test-user-123', 'owner'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
        body: {
          title: 'Attempted Unauthorized Update',
          ownerId: 'original-owner-456'
        },
      }, res);
    });

    it('DELETE /posts uses server authorization check, not client ownerId', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'original-owner-456', // Different from authenticated user
              title: 'Original Title',
              content: 'Original content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          throw new Error('Post not found');
        },
        delete: async (id) => {
          expect(id).toBe('test-post-123');
          return true;
        },
      });

      const { app } = await makeApp({ repository });

      // Admin should be able to delete any post
      const res = await request(app)
        .delete('/posts/test-post-123')
        .set('Cookie', makeSessionCookie('admin-user-789', 'admin'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'admin-user-789')
        .set('X-User-Role', 'admin');

      expect(res.status).toBe(204);

      saveTestOutput('delete-admin-authorized', {
        method: 'DELETE',
        url: '/posts/test-post-123',
        headers: {
          Cookie: makeSessionCookie('admin-user-789', 'admin'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'admin-user-789',
          'X-User-Role': 'admin'
        },
      }, res);
    });

    it('owner cannot delete post they do not own, even with client ownerId claim', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'original-owner-456', // Different from authenticated user
              title: 'Original Title',
              content: 'Original content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          throw new Error('Post not found');
        },
        delete: async () => {
          throw new Error('Repository should not be called when user is not authorized');
        },
      });

      const { app } = await makeApp({ repository });

      const res = await request(app)
        .delete('/posts/test-post-123')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('Accept', 'application/json')
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');

      saveTestOutput('delete-owner-mischief-rejected', {
        method: 'DELETE',
        url: '/posts/test-post-123',
        headers: {
          Cookie: makeSessionCookie('test-user-123', 'owner'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'test-user-123',
          'X-User-Role': 'owner'
        },
      }, res);
    });
  });

  describe('Authorization bypass attempts', () => {
    it('cannot bypass authorization by supplying ownerId in malformed request', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'original-owner-456',
              title: 'Original Title',
              content: 'Original content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          throw new Error('Post not found');
        },
        update: async () => {
          throw new Error('Repository should not be called when authorization fails');
        },
      });

      const { app } = await makeApp({ repository });

      // Try to send a request with ownerId in a way that might bypass schema validation
      const res = await request(app)
        .patch('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .set('X-Requested-With', 'XMLHttpRequest') // Common header that might be used for bypass
        .send(JSON.stringify({
          title: 'Bypass Attempt',
          ownerId: 'original-owner-456' // Try to claim ownership
        }));

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('admin role is validated server-side, not from client', async () => {
      const repository = buildRepository({
        getById: async (id) => {
          if (id === 'test-post-123') {
            return {
              id: 'test-post-123',
              ownerId: 'original-owner-456',
              title: 'Original Title',
              content: 'Original content',
              tags: [],
              published: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          throw new Error('Post not found');
        },
        update: async (id, partial) => {
          // This should be called only if the user is actually an admin
          expect(id).toBe('test-post-123');
          return {
            id: 'test-post-123',
            ownerId: 'original-owner-456',
            title: partial.title || 'Updated',
            content: partial.content || 'Updated content',
            tags: [],
            published: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        },
      });

      const { app } = await makeApp({ repository });

      // Try to impersonate admin by sending wrong role in header
      const res = await request(app)
        .patch('/posts/test-post-123')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('regular-user-123', 'owner')) // Actually owner, not admin
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'regular-user-123')
        .set('X-User-Role', 'admin') // Lie about being admin
        .send({
          title: 'Admin Impersonation Attempt'
        });

      // Should be rejected because server validates actual session, not header
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      // message text may vary; code is authoritative

      saveTestOutput('admin-impersonation-rejected', {
        method: 'PATCH',
        url: '/posts/test-post-123',
        headers: {
          Cookie: makeSessionCookie('regular-user-123', 'owner'),
          'X-CSRF-Token': 'valid-csrf-token',
          'X-User-Id': 'regular-user-123',
          'X-User-Role': 'admin' // False claim
        },
        body: {
          title: 'Admin Impersonation Attempt'
        },
      }, res);
    });
  });

  describe('Error response format', () => {
    it('includes requestId in all owner mischief rejection responses', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .set('X-Request-Id', 'mischief-test-123')
        .send({
          title: 'Error Response Test',
          content: 'This should be rejected',
          ownerId: 'malicious-user-456'
        });

      expect(res.status).toBe(422);
      expect(res.body.requestId).toBe('mischief-test-123');
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('sets Cache-Control: no-store on owner mischief rejection responses', async () => {
      const { app } = await makeApp();

      const res = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
        .set('X-CSRF-Token', 'valid-csrf-token')
        .set('X-User-Id', 'test-user-123')
        .set('X-User-Role', 'owner')
        .send({
          title: 'Cache Control Test',
          content: 'This should be rejected',
          ownerId: 'malicious-user-456'
        });

      expect(res.status).toBe(422);
      expect(res.headers['cache-control']).toBe('no-store');
    });
  });

  describe('Audit logging for owner mischief attempts', () => {
    it('logs denied attempts with correct user identity', async () => {
      const capturedLogs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        capturedLogs.push(args.join(' '));
        originalConsoleLog(...args);
      };

      try {
        const repository = buildRepository({
          getById: async (id) => {
            if (id === 'test-post-123') {
              return {
                id: 'test-post-123',
                ownerId: 'original-owner-456',
                title: 'Original Title',
                content: 'Original content',
                tags: [],
                published: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }
            throw new Error('Post not found');
          },
          update: async () => {
            throw new Error('Repository should not be called when authorization fails');
          },
        });

        const { app } = await makeApp({ repository });

        await request(app)
          .patch('/posts/test-post-123')
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set('Cookie', makeSessionCookie('test-user-123', 'owner'))
          .set('X-CSRF-Token', 'valid-csrf-token')
          .set('X-User-Id', 'test-user-123')
          .set('X-User-Role', 'owner')
          .set('X-Request-Id', 'audit-test-123')
          .send({
            title: 'Audit Test'
          });

        // Check that audit log was created with correct user identity
        expect(capturedLogs.length).toBeGreaterThan(0);
        const auditLog = JSON.parse(capturedLogs[capturedLogs.length - 1]);
        expect(auditLog.userId).toBe('test-user-123');
        expect(auditLog.role).toBe('owner');
        expect(auditLog.status).toBe(403);
        expect(auditLog.targetId).toBe('test-post-123');
        expect(auditLog.verb).toBe('update');
        expect(auditLog.requestId).toBe('audit-test-123');

      } finally {
        console.log = originalConsoleLog;
      }
    });
  });
});

