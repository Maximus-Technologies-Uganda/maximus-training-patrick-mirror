/**
 * cors.origin-null.spec.ts
 * Contract tests for Origin: null rejection (T069)
 *
 * Requirements:
 * - Reject Origin: null by default
 * - Allow Origin: null only when ALLOW_NULL_ORIGIN=true (dev mode)
 * - Never allow wildcard (*) in production
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryPostsRepository } from '../../src/repositories/posts.repository';
import { loadConfigFromEnv } from '../../src/config';

describe('CORS Origin: null Rejection Tests (T069)', () => {
  const config = loadConfigFromEnv();
  const repository = new InMemoryPostsRepository();
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.ALLOW_NULL_ORIGIN;
    delete process.env.NODE_ENV;
    app = createApp(config, repository);
  });

  describe('Origin: null handling (default - reject)', () => {
    it('should reject preflight OPTIONS with Origin: null', async () => {
      const response = await request(app)
        .options('/posts')
        .set('Origin', 'null')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN_NULL_ORIGIN');
      expect(response.body.hint).toContain('ALLOW_NULL_ORIGIN');
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('should reject GET request with Origin: null', async () => {
      const response = await request(app)
        .get('/posts')
        .set('Origin', 'null');

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN_NULL_ORIGIN');
      expect(response.body.hint).toContain('ALLOW_NULL_ORIGIN');
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });
  });

  describe('Origin: null with ALLOW_NULL_ORIGIN=true (dev mode)', () => {
    beforeEach(() => {
      process.env.ALLOW_NULL_ORIGIN = 'true';
      app = createApp(config, repository);
    });

    it('should allow preflight OPTIONS with Origin: null when flag is set', async () => {
      const response = await request(app)
        .options('/posts')
        .set('Origin', 'null')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
    });
  });

  describe('Wildcard (*) in production guard', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGINS = '*';
      app = createApp(config, repository);
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
      delete process.env.CORS_ORIGINS;
    });

    it('should return 500 when wildcard is used in production (preflight)', async () => {
      const response = await request(app)
        .options('/posts')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('INVALID_CORS_CONFIG');
      expect(response.body.hint).toContain('CORS_ORIGINS');
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('should return 500 when wildcard is used in production (normal request)', async () => {
      const response = await request(app)
        .get('/posts')
        .set('Origin', 'https://example.com');

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('INVALID_CORS_CONFIG');
      expect(response.body.hint).toContain('CORS_ORIGINS');
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });
  });

  describe('CORS header validation', () => {
    beforeEach(() => {
      process.env.CORS_ORIGINS = 'http://localhost:3000';
      app = createApp(config, repository);
    });

    it('should include Access-Control-Max-Age in preflight response', async () => {
      const response = await request(app)
        .options('/posts')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-max-age']).toBe('600');
    });

    it('should include Vary header with Origin in preflight', async () => {
      const response = await request(app)
        .options('/posts')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['vary']).toContain('Origin');
    });

    it('should include Vary header with request headers when present', async () => {
      const response = await request(app)
        .options('/posts')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Authorization');

      expect(response.status).toBe(204);
      expect(response.headers['vary']).toContain('Origin');
      expect(response.headers['vary']).toContain('Access-Control-Request-Headers');
    });
  });
});
