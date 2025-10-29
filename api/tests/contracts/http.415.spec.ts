import request from "supertest";
import { createApp } from "../../src/app";
import { loadConfigFromEnv } from "../../src/config";
import { createRepository } from "../../src/repositories/posts-repository";

async function makeApp() {
  const base = loadConfigFromEnv();
  const config = { ...base, rateLimitMax: 1000 };
  const repository = await createRepository();
  return createApp(config, repository);
}

describe('415 Unsupported Media Type (T060)', () => {
  it('returns 415 with standardized envelope when Content-Type is not application/json', async () => {
    const app = await makeApp();

    const res = await request(app)
      .post('/posts')
      .set('Accept', 'application/json')
      .set('Content-Type', 'text/plain')
      .send('This is not JSON');

    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    expect(res.body.message).toBe('Content-Type must be application/json for mutating requests');
  });

  it('returns 415 when Content-Type is invalid but body is present', async () => {
    const app = await makeApp();

    const res = await request(app)
      .post('/posts')
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/xml')
      .send('<post><title>Test</title><content>Content</content></post>');

    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('sets Cache-Control: no-store on 415 responses (T087)', async () => {
    const app = await makeApp();

    const res = await request(app)
      .post('/posts')
      .set('Accept', 'application/json')
      .set('Content-Type', 'text/plain')
      .send('This is not JSON');

    expect(res.status).toBe(415);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('includes requestId in 415 response when available', async () => {
    const app = await makeApp();

    const res = await request(app)
      .post('/posts')
      .set('Content-Type', 'text/plain')
      .set('X-Request-Id', 'test-request-123')
      .send('This is not JSON');

    expect(res.status).toBe(415);
    expect(res.body.requestId).toBe('test-request-123');
  });

  it('applies to PUT requests with invalid Content-Type', async () => {
    const app = await makeApp();

    const res = await request(app)
      .put('/posts/some-id')
      .set('Content-Type', 'application/xml')
      .send('<post><title>Test</title></post>');

    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('applies to DELETE requests with invalid Content-Type', async () => {
    const app = await makeApp();

    const res = await request(app)
      .delete('/posts/some-id')
      .set('Content-Type', 'text/plain')
      .send('delete request');

    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('allows requests without Content-Type when no body is present', async () => {
    const app = await makeApp();

    const res = await request(app)
      .delete('/posts/some-id')
      .set('Authorization', 'Bearer invalid-token');

    // Should not return 415 since no body is present
    expect(res.status).not.toBe(415);
  });

  it('skips 415 validation for GET requests', async () => {
    const app = await makeApp();

    const res = await request(app)
      .get('/posts')
      .set('Content-Type', 'text/plain');

    // Should not return 415 for GET requests
    expect(res.status).not.toBe(415);
  });

  it('skips 415 validation for OPTIONS requests', async () => {
    const app = await makeApp();

    const res = await request(app)
      .options('/posts')
      .set('Content-Type', 'text/plain');

    // Should not return 415 for OPTIONS requests
    expect(res.status).not.toBe(415);
  });
});
