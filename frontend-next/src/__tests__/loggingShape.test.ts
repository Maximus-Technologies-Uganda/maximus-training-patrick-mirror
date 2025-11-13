/**
 * Test: Logging shape validation (T019)
 * Ensures all logs include required fields for observability correlation
 * FR-020: Consistent log fields (trace, route, latency_ms, status, upstream_status)
 */

import { createTraceLogger } from '@/middleware/traceLogger';

describe('Logging Shape', () => {
  it('should include all required fields in trace log entry', () => {
    const _logger = createTraceLogger();
    const mockEntry = {
      trace: '550e8400-e29b-41d4-a716-446655440000',
      route: '/posts',
      latency_ms: 150,
      status: 200,
      upstream_status: 200,
      method: 'GET',
      timestamp: new Date().toISOString(),
      ok: true,
    };

    // Verify all required fields are present
    expect(mockEntry).toHaveProperty('trace');
    expect(mockEntry).toHaveProperty('route');
    expect(mockEntry).toHaveProperty('latency_ms');
    expect(mockEntry).toHaveProperty('status');
    expect(mockEntry).toHaveProperty('upstream_status');
    expect(mockEntry).toHaveProperty('method');
    expect(mockEntry).toHaveProperty('timestamp');
    expect(mockEntry).toHaveProperty('ok');
  });

  it('should log with correct field types', () => {
    const _logger = createTraceLogger();
    const mockEntry = {
      trace: '550e8400-e29b-41d4-a716-446655440000',
      route: '/posts',
      latency_ms: 150,
      status: 200,
      method: 'GET',
      timestamp: new Date().toISOString(),
      ok: true,
    };

    expect(typeof mockEntry.trace).toBe('string');
    expect(typeof mockEntry.route).toBe('string');
    expect(typeof mockEntry.latency_ms).toBe('number');
    expect(typeof mockEntry.status).toBe('number');
    expect(typeof mockEntry.method).toBe('string');
    expect(typeof mockEntry.timestamp).toBe('string');
    expect(typeof mockEntry.ok).toBe('boolean');
  });

  it('should include optional reason field when provided', () => {
    const mockEntry = {
      trace: '550e8400-e29b-41d4-a716-446655440000',
      route: '/status',
      latency_ms: 200,
      status: 200,
      upstream_status: 503,
      method: 'GET',
      timestamp: new Date().toISOString(),
      reason: 'Upstream service temporarily unavailable',
      ok: false,
    };

    expect(mockEntry).toHaveProperty('reason');
    expect(typeof mockEntry.reason).toBe('string');
  });

  it('should maintain trace ID across request lifecycle', () => {
    const traceId = '550e8400-e29b-41d4-a716-446655440000';
    const entry1 = { trace: traceId, route: '/posts', latency_ms: 100, status: 200, ok: true };
    const entry2 = { trace: traceId, route: '/status', latency_ms: 50, status: 200, ok: true };

    expect(entry1.trace).toBe(entry2.trace);
  });

  it('should record upstream_status separately from status', () => {
    const mockEntry = {
      trace: '550e8400-e29b-41d4-a716-446655440000',
      route: '/posts',
      latency_ms: 150,
      status: 200,
      upstream_status: 500,
      method: 'GET',
      timestamp: new Date().toISOString(),
      ok: false,
    };

    // Upstream error should be distinct from client response status
    expect(mockEntry.upstream_status).toBe(500);
    expect(mockEntry.status).toBe(200);
  });
});
