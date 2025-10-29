/**
 * http.406.spec.ts
 * Contract tests for 406 Not Acceptable responses (T068, T086)
 *
 * Requirements:
 * - POST/PUT/DELETE without Accept: application/json returns 406
 * - Response includes standardized error envelope
 * - Accept: star/star should be allowed
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryPostsRepository } from '../../src/repositories/posts.repository';
import { loadConfigFromEnv } from '../../src/config';

describe('HTTP 406 Not Acceptable Contract Tests', () => {
  const config = loadConfigFromEnv();
  const repository = new InMemoryPostsRepository();
  const app = createApp(config, repository);

  describe('POST /posts without Accept: application/json', () => {
    it('should return 406 when Accept header is missing', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .send({ title: 'Test', body: 'Test body' });

      expect(response.status).toBe(406);
      expect(response.body).toMatchObject({
        code: 'NOT_ACCEPTABLE',
        message: expect.stringContaining('application/json'),
        requestId: expect.any(String),
        hint: expect.stringContaining('application/json')
      });
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('should return 406 when Accept header is text/html', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'text/html')
        .send({ title: 'Test', body: 'Test body' });

      expect(response.status).toBe(406);
      expect(response.body.code).toBe('NOT_ACCEPTABLE');
      expect(response.body.hint).toContain('application/json');
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('should allow Accept: application/json', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send({ title: 'Test Post', body: 'Test body content' });

      expect(response.status).not.toBe(406);
    });

    it('should allow Accept with wildcard', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Content-Type', 'application/json')
        .set('Accept', '*/*')
        .send({ title: 'Test Post', body: 'Test body content' });

      expect(response.status).not.toBe(406);
    });
  });

  describe('PUT /posts/:id without Accept: application/json', () => {
    it('should return 406 when Accept header is missing', async () => {
      const response = await request(app)
        .put('/posts/123')
        .set('Content-Type', 'application/json')
        .send({ title: 'Updated', body: 'Updated body' });

      expect(response.status).toBe(406);
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });
  });

  describe('DELETE /posts/:id without Accept: application/json', () => {
    it('should return 406 when Accept header is missing', async () => {
      const response = await request(app)
        .delete('/posts/123')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(406);
      expect(response.body.requestId).not.toBe('unknown');
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });
  });
  describe('GET /posts negotiation', () => {
    it('returns 406 when Accept header explicitly excludes JSON', async () => {
      const response = await request(app)
        .get('/posts')
        .set('Accept', 'text/html');

      expect(response.status).toBe(406);
      expect(response.body.code).toBe('NOT_ACCEPTABLE');
      expect(response.body.hint).toContain('application/json');
    });

    it('allows GET without Accept header', async () => {
      const ok = await request(app).get('/posts');
      expect(ok.status).toBe(200);
    });
  });
});
