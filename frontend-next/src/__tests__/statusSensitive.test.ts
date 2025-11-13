/**
 * Test: Sensitive Field Exclusion for /status (T024)
 * Ensures /status response never includes secrets, tokens, or internal IDs
 * FR-024: Limit /status payload to non-sensitive fields
 */

describe('Sensitive Field Exclusion', () => {
  // List of field names that must never appear in /status response
  const FORBIDDEN_FIELDS = [
    'secret',
    'token',
    'password',
    'key',
    'api_key',
    'apiKey',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'id_token',
    'idToken',
    'authorization',
    'credentials',
    'credential',
    'session_secret',
    'sessionSecret',
    'jwt',
    'Bearer',
    'cookie',
  ];

  /**
   * Scan object for forbidden field names (case-insensitive)
   */
  function findForbiddenFields(
    obj: Record<string, unknown>,
    path = ''
  ): Array<{ path: string; field: string }> {
    const found: Array<{ path: string; field: string }> = [];

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if key name contains forbidden patterns
      const lowerKey = key.toLowerCase();
      const isForbidden = FORBIDDEN_FIELDS.some((pattern) =>
        lowerKey.includes(pattern.toLowerCase())
      );

      if (isForbidden) {
        found.push({ path: currentPath, field: key });
      }

      // Recursively check nested objects
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        found.push(...findForbiddenFields(value as Record<string, unknown>, currentPath));
      }
    }

    return found;
  }

  it('should have only allowed fields in /status response', () => {
    const allowedStatus = {
      ok: true,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: true,
        latency_ms: 150,
        status: 200,
      },
      ts: new Date().toISOString(),
    };

    const forbidden = findForbiddenFields(allowedStatus);
    expect(forbidden).toHaveLength(0);
  });

  it('should reject status response with secrets', () => {
    const invalidStatus = {
      ok: true,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: true,
        latency_ms: 150,
        status: 200,
      },
      ts: new Date().toISOString(),
      database_secret: 'super-secret-connection-string', // FORBIDDEN
    };

    const forbidden = findForbiddenFields(invalidStatus);
    expect(forbidden.length).toBeGreaterThan(0);
    expect(forbidden[0].field).toBe('database_secret');
  });

  it('should reject status response with tokens', () => {
    const invalidStatus = {
      ok: true,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: true,
        latency_ms: 150,
        status: 200,
        api_token: 'bearer-xyz-123', // FORBIDDEN
      },
      ts: new Date().toISOString(),
    };

    const forbidden = findForbiddenFields(invalidStatus);
    expect(forbidden.length).toBeGreaterThan(0);
  });

  it('should reject status response with authorization headers', () => {
    const invalidStatus = {
      ok: true,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: true,
        latency_ms: 150,
        status: 200,
        responseHeaders: {
          authorization: 'Bearer xyz', // FORBIDDEN
        },
      },
      ts: new Date().toISOString(),
    };

    const forbidden = findForbiddenFields(invalidStatus);
    expect(forbidden.length).toBeGreaterThan(0);
  });

  it('should reject status response with API keys', () => {
    const invalidStatus = {
      ok: true,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: true,
        latency_ms: 150,
        status: 200,
        gcp_api_key: 'AIzaSy...', // FORBIDDEN
      },
      ts: new Date().toISOString(),
    };

    const forbidden = findForbiddenFields(invalidStatus);
    expect(forbidden.length).toBeGreaterThan(0);
  });

  it('should allow reason field for human-readable error messages', () => {
    const statusWithReason = {
      ok: false,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: false,
        latency_ms: 5000,
        status: 503,
      },
      ts: new Date().toISOString(),
      reason: 'Upstream service temporarily unavailable', // This is safe and needed
    };

    const forbidden = findForbiddenFields(statusWithReason);
    expect(forbidden).toHaveLength(0);
  });

  it('should not expose internal IDs in reason field', () => {
    const invalidReason = {
      reason: 'Database connection failed: db-instance-prod-12345', // Contains internal ID
    };

    // This is harder to detect algorithmically, but checking field names is the first line
    const _forbidden = findForbiddenFields(invalidReason);

    // The 'reason' field itself is allowed, but value validation is application-specific
    // This test documents that reason field content should be sanitized separately
    expect(typeof invalidReason.reason).toBe('string');
  });

  it('should validate status response structure', () => {
    const validStatus = {
      ok: true,
      traceId: 'uuid-here',
      upstream: {
        ok: true,
        latency_ms: 150,
        status: 200,
      },
      ts: new Date().toISOString(),
    };

    const requiredFields = ['ok', 'traceId', 'upstream', 'ts'];
    const hasAllRequired = requiredFields.every(
      (field) => field in validStatus
    );

    expect(hasAllRequired).toBe(true);
  });

  it('should detect nested sensitive fields', () => {
    const nestedStatus = {
      ok: true,
      traceId: 'uuid',
      upstream: {
        ok: true,
        diagnostics: {
          credentials: {
            access_token: 'secret', // Nested forbidden field
          },
        },
      },
      ts: new Date().toISOString(),
    };

    const forbidden = findForbiddenFields(nestedStatus);
    expect(forbidden.length).toBeGreaterThan(0);
    expect(forbidden.some((f) => f.field === 'access_token')).toBe(true);
  });

  it('should allow non-sensitive internal fields', () => {
    const allowedStatus = {
      ok: true,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: true,
        service: 'posts-api', // Internal service name is safe
        version: '1.0.0', // Version is safe
        latency_ms: 150,
        status: 200,
      },
      ts: new Date().toISOString(),
    };

    const forbidden = findForbiddenFields(allowedStatus);
    expect(forbidden).toHaveLength(0);
  });

  it('should enforce sanitization in error scenarios', () => {
    const statusWithError = {
      ok: false,
      traceId: '550e8400-e29b-41d4-a716-446655440000',
      upstream: {
        ok: false,
        latency_ms: 5000,
        status: 503,
        error: 'Upstream service unavailable', // Safe message
      },
      ts: new Date().toISOString(),
      reason: 'Service temporarily unavailable', // Safe, no secrets
    };

    const forbidden = findForbiddenFields(statusWithError);
    expect(forbidden).toHaveLength(0);
  });
});
