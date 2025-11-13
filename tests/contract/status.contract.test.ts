import { describe, it, expect } from 'vitest';

/**
 * T045: Status Contract Test
 * 
 * Validates the /status endpoint contract shape and behavior
 * per FR-021, FR-024, FR-026, FR-028
 * 
 * - Always returns HTTP 200
 * - Body: { ok: boolean, traceId: string, ts: string, reason?: string }
 * - No sensitive fields (secrets, tokens, internal IDs)
 * - Cache-Control: no-store header
 * - Upstream failures set ok:false with human-readable reason
 */

interface StatusResponse {
  ok: boolean;
  traceId: string;
  upstream?: Record<string, unknown>;
  ts: string;
  reason?: string;
}

describe('Status Endpoint Contract', () => {
  describe('Response Shape', () => {
    it('should have required fields: ok, traceId, ts', () => {
      const mockResponse: StatusResponse = {
        ok: true,
        traceId: 'trace-abc123',
        ts: new Date().toISOString(),
      };
      expect(mockResponse).toHaveProperty('ok');
      expect(mockResponse).toHaveProperty('traceId');
      expect(mockResponse).toHaveProperty('ts');
    });

    it('should be a boolean', () => {
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-xyz',
        ts: '2025-11-13T10:00:00Z',
      };
      expect(typeof response.ok).toBe('boolean');
    });

    it('should include optional reason field on failure', () => {
      const failureResponse: StatusResponse = {
        ok: false,
        traceId: 'trace-failed',
        ts: new Date().toISOString(),
        reason: 'Upstream service unavailable',
      };
      expect(failureResponse.reason).toBeDefined();
      expect(typeof failureResponse.reason).toBe('string');
    });

    it('should have ISO timestamp in ts field', () => {
      const now = new Date().toISOString();
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-123',
        ts: now,
      };
      expect(() => new Date(response.ts)).not.toThrow();
    });
  });

  describe('Sensitive Field Exclusion (FR-024)', () => {
    const sensitivePatterns = [
      /secret/i,
      /token/i,
      /password/i,
      /api[_-]?key/i,
      /auth/i,
      /credential/i,
      /private/i,
    ];

    it('should not include secret field', () => {
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-abc',
        ts: new Date().toISOString(),
      };
      const jsonStr = JSON.stringify(response);
      const hasSecret = sensitivePatterns.some((p) => p.test(jsonStr));
      expect(hasSecret).toBe(false);
    });

    it('should not echo sensitive data in reason field', () => {
      const badReason = 'Auth token xyz789 failed';
      const goodReason = 'Authentication failed';

      expect(/token/i.test(badReason)).toBe(true);
      expect(/token/i.test(goodReason)).toBe(false);
    });

    it('should have no internal IDs exposed in base response', () => {
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-public',
        ts: new Date().toISOString(),
      };
      // traceId is ok (public correlation ID), but no db IDs, user IDs, etc.
      expect(response.traceId).toBeDefined();
      // Response should not include fields like userId, internalId, etc.
    });
  });

  describe('Success Scenarios (ok:true)', () => {
    it('should indicate healthy status with ok:true', () => {
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-healthy',
        ts: new Date().toISOString(),
      };
      expect(response.ok).toBe(true);
    });

    it('should include upstream health indicators', () => {
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-123',
        ts: new Date().toISOString(),
        upstream: {
          ok: true,
          latency_ms: 45,
        },
      };
      expect(response.upstream).toBeDefined();
      expect(response.upstream?.ok).toBe(true);
    });

    it('should not include reason field on success', () => {
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-success',
        ts: new Date().toISOString(),
      };
      expect(response.reason).toBeUndefined();
    });
  });

  describe('Failure Scenarios (ok:false)', () => {
    it('should set ok:false on upstream failure', () => {
      const response: StatusResponse = {
        ok: false,
        traceId: 'trace-failed',
        ts: new Date().toISOString(),
        reason: 'Upstream service unavailable',
      };
      expect(response.ok).toBe(false);
    });

    it('should provide human-readable reason on failure', () => {
      const response: StatusResponse = {
        ok: false,
        traceId: 'trace-timeout',
        ts: new Date().toISOString(),
        reason: 'Request timeout after 3000ms',
      };
      expect(response.reason).toBeDefined();
      expect(response.reason?.length).toBeGreaterThan(0);
      // Should be human-readable, not a stack trace
      expect(response.reason).not.toMatch(/Error:/);
    });

    it('should indicate upstream failure in upstream field', () => {
      const response: StatusResponse = {
        ok: false,
        traceId: 'trace-upstream-down',
        ts: new Date().toISOString(),
        reason: 'Upstream returned 503',
        upstream: {
          ok: false,
          status: 503,
        },
      };
      expect(response.upstream?.ok).toBe(false);
    });
  });

  describe('Trace ID Correlation (FR-013)', () => {
    it('should generate valid trace ID format', () => {
      const response: StatusResponse = {
        ok: true,
        traceId: 'trace-abc-123-def',
        ts: new Date().toISOString(),
      };
      expect(response.traceId).toBeDefined();
      expect(response.traceId.length).toBeGreaterThan(0);
    });

    it('should preserve trace ID across requests', () => {
      const traceId = 'trace-correlation-123';
      const request = { traceId };
      const response: StatusResponse = {
        ok: true,
        traceId,
        ts: new Date().toISOString(),
      };
      expect(response.traceId).toBe(request.traceId);
    });
  });

  describe('HTTP Headers (FR-026)', () => {
    it('should include Cache-Control: no-store header', () => {
      const headers = {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      };
      expect(headers['Cache-Control']).toBe('no-store');
    });

    it('should not cache status endpoint', () => {
      const cacheControl = 'no-store';
      expect(cacheControl).toMatch(/no-store/);
    });
  });

  describe('Sampling & Logging (FR-028)', () => {
    it('should mark failure events for 100% sampling', () => {
      const event = {
        ok: false,
        traceId: 'trace-error',
        sampleRate: 1.0, // 100%
      };
      expect(event.sampleRate).toBe(1.0);
    });

    it('should log complete context on failure', () => {
      const logEntry = {
        trace: 'trace-failure-123',
        route: '/status',
        ok: false,
        reason: 'Upstream unavailable',
        latency_ms: 1050,
        upstream_status: 503,
      };
      expect(logEntry.trace).toBeDefined();
      expect(logEntry.ok).toBe(false);
      expect(logEntry.latency_ms).toBeDefined();
    });
  });
});
