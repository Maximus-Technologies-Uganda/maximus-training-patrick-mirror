import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { createRepository } from "../../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  // Set a smaller limit for testing (100 bytes instead of 1MB)
  const config = { ...base, jsonLimit: '100b' };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('413 Payload Too Large (T047)', () => {
  it('returns 413 with standardized envelope when JSON body exceeds limit', async () => {
    const app = await makeApp();

    // Create a large JSON payload that exceeds the 100b limit
    const largePayload = {
      title: 'A'.repeat(50),
      content: 'B'.repeat(50),
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    };

    const res = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer invalid-token') // Will fail auth but should hit body limit first
      .send(largePayload);

    // Should return 413 before auth validation
    expect(res.status).toBe(413);
    // Standardized JSON envelope is returned; content-length is implementation-defined.
    // Do not assert exact content-length value.
    expect(String(res.body.code).toLowerCase()).toBe('payload_too_large');
    expect(res.body.message).toBe('Request payload exceeds 1MB limit');
  });

  it('sets Cache-Control: no-store on 413 responses', async () => {
    const app = await makeApp();

    const largePayload = {
      title: 'A'.repeat(50),
      content: 'B'.repeat(50)
    };

    const res = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer invalid-token')
      .send(largePayload);

    expect(res.status).toBe(413);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('includes requestId in 413 response when available', async () => {
    const app = await makeApp();

    const largePayload = {
      title: 'A'.repeat(50),
      content: 'B'.repeat(50)
    };

    const res = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer invalid-token')
      .set('X-Request-Id', 'test-request-123')
      .send(largePayload);

    expect(res.status).toBe(413);
    expect(res.body.requestId).toBe('test-request-123');
  });

  it('applies to PUT requests with oversized bodies', async () => {
    const app = await makeApp();

    const largePayload = {
      title: 'A'.repeat(50),
      content: 'B'.repeat(50)
    };

    const res = await request(app)
      .put('/posts/some-id')
      .set('Authorization', 'Bearer invalid-token')
      .send(largePayload);

    expect(res.status).toBe(413);
    expect(String(res.body.code).toLowerCase()).toBe('payload_too_large');
  });

  it('applies to DELETE requests with oversized bodies (if any)', async () => {
    const app = await makeApp();

    const largePayload = {
      title: 'A'.repeat(50),
      content: 'B'.repeat(50)
    };

    const res = await request(app)
      .delete('/posts/some-id')
      .set('Authorization', 'Bearer invalid-token')
      .send(largePayload);

    expect(res.status).toBe(413);
    expect(String(res.body.code).toLowerCase()).toBe('payload_too_large');
  });
});
