import request from 'supertest';
import { createApp } from '../../src/app';
import { loadConfigFromEnv } from '../../src/config'; // Corrected import path
import { InMemoryPostsRepository } from '../../src/repositories/posts.repository';
import { Application } from 'express';

// Mock the firebaseAuth middleware to control req.user.userId
jest.mock('../../src/middleware/firebaseAuth', () => ({
  verifyFirebaseIdToken: jest.fn((req, res, next) => {
    const authz = req.get('Authorization');
    if (authz && authz.startsWith('Bearer ')) {
      const token = authz.slice('Bearer '.length);
      if (token === 'valid-token') {
        (req as any).user = { userId: 'test-user-id' };
      } else if (token === 'forbidden-token') {
        (req as any).user = { userId: 'another-user-id' };
      } else if (token === 'admin-token') {
        (req as any).user = { userId: 'admin-user-id' };
      }
    }
    next();
  }),
}));

describe('Posts API Contract Tests', () => {
  let app: Application;
  let originalReadOnly: string | undefined;

  beforeEach(() => {
    // Create a fresh app instance for each test to ensure isolated state
    const config = loadConfigFromEnv();
    const repository = new InMemoryPostsRepository();
    app = createApp(config, repository);
    originalReadOnly = process.env.READ_ONLY;
  });

  afterEach(() => {
    process.env.READ_ONLY = originalReadOnly;
  });

  // --- POST /posts ---
  describe('POST /posts', () => {
    it('should return 201 for a valid post creation', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'New Post', content: 'Content of the new post.' });
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Post');
    });

    it('should return 401 if authentication is missing', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ title: 'New Post', content: 'Content of the new post.' });
      expect(response.statusCode).toBe(401);
      expect(String(response.body.code).toUpperCase()).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user has insufficient permissions', async () => {
      // First, create a post with 'test-user-id'
      // First, create a post with 'test-user-id'
      const createResponse = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Post by Test User', content: 'Content.' });
      expect(createResponse.statusCode).toBe(201);
      const postId = createResponse.body.id;

      // Then, try to update it with 'another-user-id'
      const response = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', 'Bearer forbidden-token') // This token maps to 'another-user-id'
        .set('Accept', 'application/json')
        .set('X-User-Id', 'another-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Attempted Update', content: 'New content.' });
      expect(response.statusCode).toBe(403);
      expect(String(response.body.code).toUpperCase()).toBe('FORBIDDEN');
    });

    it('should return 422 for invalid payload', async () => {
      const response = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ content: 'Missing title' }); // Invalid payload
      expect(response.statusCode).toBe(422);
      expect(String(response.body.code).toUpperCase()).toBe('VALIDATION_ERROR');
      const details = response.body.details;
      expect(details === undefined || Array.isArray(details) || typeof details === 'object').toBe(true);
    });

    it('should return 429 if rate limit exceeded', async () => {
      const numRequests = 101;
      let lastResponse: request.Response | undefined;

      for (let i = 0; i < numRequests; i++) {
        lastResponse = await request(app)
          .post('/posts')
          .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('X-User-Id', 'test-user-id')
          .set('X-User-Role', 'owner')
          .send({ title: `Post ${i}`, content: `Content ${i}.` });
      }

      expect(lastResponse).toBeDefined();
      expect(lastResponse!.statusCode).toBe(429);
      expect(String(lastResponse!.body.code).toUpperCase()).toBe('RATE_LIMITED');
      expect(lastResponse!.headers).toHaveProperty('retry-after');
    });

    it('should return 413 if payload is too large', async () => {
      const largeBody = 'a'.repeat(1024 * 1024 + 1); // > 1MB
      const response = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Large Post', content: largeBody });
      expect(response.statusCode).toBe(413);
      expect(String(response.body.code).toLowerCase()).toBe('payload_too_large');
    });

    it('should return 503 if service is in read-only mode (T036)', async () => {
      process.env.READ_ONLY = 'true';
      const response = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ title: 'New Post', content: 'Content of the new post.' });
      expect(response.statusCode).toBe(503);
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  // --- GET /posts/{id} ---
  describe('GET /posts/:id', () => {
    it('should return 200 for a public post', async () => {
      // Seed a post as an authenticated user, then fetch it anonymously
      const createResponse = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ title: 'Public Post', content: 'Public content.' });
      expect(createResponse.statusCode).toBe(201);
      const postId = createResponse.body.id;

      const response = await request(app)
        .get(`/posts/${postId}`)
        .set('Accept', 'application/json');
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('id', postId);
    });

    it('should return 404 for a non-existent post', async () => {
      const response = await request(app)
        .get('/posts/non-existent')
        .set('Accept', 'application/json');
      expect(response.statusCode).toBe(404);
      // API returns 404 with empty body for not found; envelope not required here
    });
  });

  // --- PUT /posts/{id} ---
  describe('PUT /posts/:id', () => {
    it('should return 200 for a valid post update by owner', async () => {
      // First, create a post with 'test-user-id'
      const createResponse = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Post by Test User', content: 'Content.' });
      expect(createResponse.statusCode).toBe(201);
      const postId = createResponse.body.id;

      const response = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Updated Post', content: 'Updated content.' });
      expect(response.statusCode).toBe(200);
      expect(response.body.title).toBe('Updated Post');
    });

    it('should return 401 if authentication is missing', async () => {
      const response = await request(app)
        .put('/posts/some-post-id')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ title: 'Updated Post', content: 'Updated content.' });
      expect(response.statusCode).toBe(401);
      expect(String(response.body.code).toUpperCase()).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user is not authorized (e.g., not owner/admin)', async () => {
      // First, create a post with 'test-user-id'
      const createResponse = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Post by Test User', content: 'Content.' });
      expect(createResponse.statusCode).toBe(201);
      const postId = createResponse.body.id;

      // Then, try to update it with 'another-user-id'
      const response = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', 'Bearer forbidden-token') // This token maps to 'another-user-id'
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send({ title: 'Attempted Update', content: 'New content.' });
      expect(response.statusCode).toBe(403);
      expect(String(response.body.code).toUpperCase()).toBe('FORBIDDEN');
    });

    it('should return 422 for invalid payload', async () => {
      const response = await request(app)
        .put('/posts/some-post-id')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: '' }); // Invalid payload
      expect(response.statusCode).toBe(422);
      expect(String(response.body.code).toUpperCase()).toBe('VALIDATION_ERROR');
    });

    it('should return 429 if rate limit exceeded', async () => {
      const numRequests = 101;
      let lastResponse: request.Response | undefined;

      for (let i = 0; i < numRequests; i++) {
        lastResponse = await request(app)
          .put('/posts/some-post-id')
          .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('X-User-Id', 'test-user-id')
          .set('X-User-Role', 'owner')
          .send({ title: `Updated Post ${i}`, content: `Updated content ${i}.` });
      }

      expect(lastResponse).toBeDefined();
      expect(lastResponse!.statusCode).toBe(429);
      expect(String(lastResponse!.body.code).toUpperCase()).toBe('RATE_LIMITED');
      expect(lastResponse!.headers).toHaveProperty('retry-after');
    });

    it('should return 413 if payload is too large', async () => {
      const largeBody = 'b'.repeat(1024 * 1024 + 1); // > 1MB
      const response = await request(app)
        .put('/posts/some-post-id')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Large Update', content: largeBody });
      expect(response.statusCode).toBe(413);
      expect(String(response.body.code).toLowerCase()).toBe('payload_too_large');
    });

    it('should return 503 if service is in read-only mode (T036)', async () => {
      process.env.READ_ONLY = 'true';
      const response = await request(app)
        .put('/posts/some-post-id')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Updated Post', content: 'Updated content.' });
      expect(response.statusCode).toBe(503);
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  // --- DELETE /posts/{id} ---
  describe('DELETE /posts/:id', () => {
    it('should return 204 for a valid post deletion by owner', async () => {
      // First, create a post with 'test-user-id'
      const createResponse = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Post to Delete', content: 'Content.' });
      expect(createResponse.statusCode).toBe(201);
      const postId = createResponse.body.id;

      const response = await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json');
      expect(response.statusCode).toBe(204);
    });

    it('should return 401 if authentication is missing', async () => {
      const response = await request(app)
        .delete('/posts/some-post-id')
        .set('Accept', 'application/json');
      expect(response.statusCode).toBe(401);
      expect(String(response.body.code).toUpperCase()).toBe('UNAUTHORIZED');
    });

    it('should return 403 if user is not authorized (e.g., not owner/admin)', async () => {
      // First, create a post with 'test-user-id'
      const createResponse = await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .send({ title: 'Post to Delete by Another User', content: 'Content.' });
      expect(createResponse.statusCode).toBe(201);
      const postId = createResponse.body.id;

      // Then, try to delete it with 'another-user-id'
      const response = await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', 'Bearer forbidden-token') // This token maps to 'another-user-id'
        .set('Accept', 'application/json')
        .set('X-User-Id', 'another-user-id')
        .set('X-User-Role', 'owner');
      expect(response.statusCode).toBe(403);
      expect(String(response.body.code).toUpperCase()).toBe('FORBIDDEN');
    });

    it('should return 429 if rate limit exceeded', async () => {
      const numRequests = 101;
      let lastResponse: request.Response | undefined;

      for (let i = 0; i < numRequests; i++) {
        lastResponse = await request(app)
          .delete('/posts/some-post-id')
          .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
          .set('Accept', 'application/json');
      }

      expect(lastResponse).toBeDefined();
      expect(lastResponse!.statusCode).toBe(429);
      expect(String(lastResponse!.body.code).toUpperCase()).toBe('RATE_LIMITED');
      expect(lastResponse!.headers).toHaveProperty('retry-after');
    });

    it('should return 503 if service is in read-only mode (T036)', async () => {
      process.env.READ_ONLY = 'true';
      const response = await request(app)
        .delete('/posts/some-post-id')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-Id', 'test-user-id')
        .set('X-User-Role', 'owner')
        .set('Accept', 'application/json');
      expect(response.statusCode).toBe(503);
      expect(response.body.code).toBe('SERVICE_UNAVAILABLE');
    });
  });
});
