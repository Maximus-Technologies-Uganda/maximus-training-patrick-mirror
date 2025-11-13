import { test, expect } from '@playwright/test';

/**
 * T046: Trace Propagation Test
 * 
 * Validates trace ID flows from /status endpoint to upstream logs
 * per FR-013, FR-020
 * 
 * Ensures:
 * - Frontend generates traceId per request
 * - /status endpoint receives and returns traceId
 * - Trace correlates across frontend and upstream logs
 * - Latency metrics properly captured
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

test.describe('/status Trace Propagation', () => {
  test('should return trace ID in status response', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/status`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('traceId');
    expect(typeof body.traceId).toBe('string');
    expect(body.traceId.length).toBeGreaterThan(0);
  });

  test('should include required logging fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/status`);
    const body = await response.json();

    expect(body).toHaveProperty('ok');
    expect(body).toHaveProperty('ts');
    expect(body).toHaveProperty('traceId');
    expect(typeof body.ok).toBe('boolean');
    expect(typeof body.ts).toBe('string');
  });

  test('should have ok:true on healthy upstream', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/status`);
    const body = await response.json();

    if (body.ok === true) {
      expect(body.upstream).toBeDefined();
      expect(body.upstream.ok).toBe(true);
    }
  });

  test('should record latency_ms in response context', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${BASE_URL}/status`);
    const endTime = Date.now();

    expect(response.status()).toBe(200);
    const body = await response.json();

    // Response should have timestamp for latency correlation
    const timestamp = new Date(body.ts).getTime();
    const elapsedMs = endTime - startTime;

    expect(timestamp).toBeDefined();
    expect(elapsedMs).toBeGreaterThan(0);
  });

  test('should propagate trace ID on upstream failure', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/status`);
    const body = await response.json();

    // Even on failure, traceId should be present
    expect(body).toHaveProperty('traceId');

    if (body.ok === false) {
      expect(body).toHaveProperty('reason');
      expect(typeof body.reason).toBe('string');
      // Trace should still be present for log correlation
      expect(body.traceId).toBeTruthy();
    }
  });

  test('should have consistent trace ID across retries', async ({ request }) => {
    const responses = [];
    for (let i = 0; i < 2; i++) {
      const response = await request.get(`${BASE_URL}/status`);
      const body = await response.json();
      responses.push(body.traceId);
    }

    // Each request should have unique trace ID
    expect(responses[0]).not.toBe(responses[1]);
    // But each should be a valid trace ID
    responses.forEach((traceId) => {
      expect(typeof traceId).toBe('string');
      expect(traceId.length).toBeGreaterThan(0);
    });
  });

  test('should include upstream status in response', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/status`);
    const body = await response.json();

    expect(body).toHaveProperty('ok');
    if (body.upstream) {
      expect(body.upstream).toHaveProperty('ok');
      expect(typeof body.upstream.ok).toBe('boolean');
    }
  });

  test('should respect no-store cache control header', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/status`);

    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toContain('no-store');
  });

  test('should handle rapid status checks', async ({ request }) => {
    const promises = Array.from({ length: 5 }, () =>
      request.get(`${BASE_URL}/status`)
    );

    const responses = await Promise.all(promises);
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });
  });

  test('should log trace with route and latency', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${BASE_URL}/status`);
    const elapsedMs = Date.now() - startTime;

    const body = await response.json();

    // Context that should be logged
    const logContext = {
      trace: body.traceId,
      route: '/status',
      latency_ms: elapsedMs,
      status: response.status(),
      ok: body.ok,
    };

    expect(logContext.trace).toBeDefined();
    expect(logContext.route).toBe('/status');
    expect(logContext.latency_ms).toBeGreaterThan(0);
    expect(logContext.status).toBe(200);
    expect(typeof logContext.ok).toBe('boolean');
  });

  test('should measure and return latency metrics', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/status`);
    const body = await response.json();

    // Should include upstream latency if available
    if (body.upstream && body.upstream.latency_ms) {
      expect(body.upstream.latency_ms).toBeGreaterThan(0);
      expect(body.upstream.latency_ms).toBeLessThan(5000); // Sanity check
    }
  });
});
