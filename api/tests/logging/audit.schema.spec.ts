import { describe, it, expect, jest } from '@jest/globals';
import { auditPost, createAuditEvent, type AuditEvent } from '../../src/logging/audit';

describe('Audit Log Schema Compliance (T074)', () => {
  it('emitted audit logs match documented schema examples', () => {
    const captured: string[] = [];
    const original = console.log as any;
    (console as any).log = (arg?: unknown) => { captured.push(String(arg ?? '')); };
    try {
      // Create a mock request with user context
      const mockRequest = {
        get: (header: string) => {
          if (header === 'x-request-id') return '550e8400-e29b-41d4-a716-446655440000';
          if (header === 'traceparent') return '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
          if (header === 'x-trace-id') return undefined;
          return undefined;
        },
        headers: {},
      } as any;

      // Set up authenticated user context
      (mockRequest as any).user = {
        userId: 'firebase-uid-abc123',
        role: 'owner',
      };

      const auditEvent = createAuditEvent(mockRequest as any, 'create', 'post-abc123', 201);

      // Verify schema matches documented examples
      expect(auditEvent).toEqual({
        level: 'info',
        type: 'audit',
        ts: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        verb: 'create',
        targetType: 'post',
        targetId: 'post-abc123',
        userId: 'firebase-uid-abc123',
        role: 'owner',
        status: 201,
        outcome: 'success',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
        retentionDays: 90,
      });

      // Verify all required fields are present
      expect(auditEvent.level).toBe('info');
      expect(auditEvent.type).toBe('audit');
      expect(auditEvent.verb).toMatch(/^(create|update|delete)$/);
      expect(auditEvent.targetType).toBe('post');
      expect(typeof auditEvent.userId).toBe('string');
      expect(auditEvent.role).toMatch(/^(owner|admin)$/);
      expect(typeof auditEvent.status).toBe('number');
      expect(typeof auditEvent.requestId).toBe('string');
      expect(typeof auditEvent.traceId).toBe('string');

    } finally {
      (console as any).log = original;
    }
  });

  it('emitted audit logs match denied operation schema', () => {
    const captured: string[] = [];
    const original = console.log as any;
    (console as any).log = (arg?: unknown) => { captured.push(String(arg ?? '')); };
    try {
      const mockRequest = {
        get: (header: string) => {
          if (header === 'x-request-id') return '550e8400-e29b-41d4-a716-446655440002';
          if (header === 'traceparent') return '00-4bf92f3577b34da6a3ce929d0e0e4738-00f067aa0ba902b7-01';
          return undefined;
        },
        headers: {},
      } as any;

      (mockRequest as any).user = {
        userId: 'firebase-uid-ghi789',
        role: 'owner',
      };

      const auditEvent = createAuditEvent(mockRequest as any, 'update', 'post-xyz789', 403);

      // Verify denied operation schema
      expect(auditEvent).toEqual({
        level: 'info',
        type: 'audit',
        ts: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        verb: 'update',
        targetType: 'post',
        targetId: 'post-xyz789',
        userId: 'firebase-uid-ghi789',
        role: 'owner',
        status: 403,
        outcome: 'denied',
        requestId: '550e8400-e29b-41d4-a716-446655440002',
        traceId: '4bf92f3577b34da6a3ce929d0e0e4738',
        retentionDays: 90,
      });

    } finally {
      (console as any).log = original;
    }
  });

  it('handles admin operations correctly', () => {
    const captured: string[] = [];
    const original = console.log as any;
    (console as any).log = (arg?: unknown) => { captured.push(String(arg ?? '')); };
    try {
      const mockRequest = {
        get: (header: string) => {
          if (header === 'x-request-id') return '550e8400-e29b-41d4-a716-446655440001';
          if (header === 'traceparent') return '00-4bf92f3577b34da6a3ce929d0e0e4737-00f067aa0ba902b7-01';
          return undefined;
        },
        headers: {},
      } as any;

      (mockRequest as any).user = {
        userId: 'firebase-uid-def456',
        role: 'admin',
      };

      const auditEvent = createAuditEvent(mockRequest as any, 'delete', 'post-xyz789', 204);

      expect(auditEvent.role).toBe('admin');
      expect(auditEvent.verb).toBe('delete');
      expect(auditEvent.status).toBe(204);

    } finally {
      (console as any).log = original;
    }
  });

  it('handles rate limit violations correctly', () => {
    const captured: string[] = [];
    const original = console.log as any;
    (console as any).log = (arg?: unknown) => { captured.push(String(arg ?? '')); };
    try {
      const mockRequest = {
        get: (header: string) => {
          if (header === 'x-request-id') return '550e8400-e29b-41d4-a716-446655440003';
          if (header === 'traceparent') return '00-4bf92f3577b34da6a3ce929d0e0e4739-00f067aa0ba902b7-01';
          return undefined;
        },
        headers: {},
      } as any;

      (mockRequest as any).user = {
        userId: 'firebase-uid-jkl012',
        role: 'owner',
      };

      const auditEvent = createAuditEvent(mockRequest as any, 'create', '', 429);

      expect(auditEvent.targetId).toBe('');
      expect(auditEvent.status).toBe(429);
      expect(auditEvent.verb).toBe('create');

    } finally {
      (console as any).log = original;
    }
  });

  it('includes all required fields and no extra fields', () => {
    const captured: string[] = [];
    const original = console.log as any;
    (console as any).log = (arg?: unknown) => { captured.push(String(arg ?? '')); };
    try {
      const mockRequest = {
        get: (header: string) => {
          if (header === 'x-request-id') return '550e8400-e29b-41d4-a716-446655440010';
          if (header === 'traceparent') return '00-4bf92f3577b34da6a3ce929d0e0e4739-00f067aa0ba902b7-01';
          return undefined;
        },
        headers: {},
      } as any;

      (mockRequest as any).user = {
        userId: 'test-user',
        role: 'owner',
      };

      const auditEvent = createAuditEvent(mockRequest as any, 'create', 'test-post', 201);

      // Required fields from schema
      expect(auditEvent).toHaveProperty('level');
      expect(auditEvent).toHaveProperty('type');
      expect(auditEvent).toHaveProperty('ts');
      expect(auditEvent).toHaveProperty('verb');
      expect(auditEvent).toHaveProperty('targetType');
      expect(auditEvent).toHaveProperty('targetId');
      expect(auditEvent).toHaveProperty('userId');
      expect(auditEvent).toHaveProperty('role');
      expect(auditEvent).toHaveProperty('status');
      expect(auditEvent).toHaveProperty('requestId');
      expect(auditEvent).toHaveProperty('traceId');
      expect(auditEvent).toHaveProperty('retentionDays', 90);

      // Should not include PII or sensitive data
      expect(auditEvent).not.toHaveProperty('email');
      expect(auditEvent).not.toHaveProperty('token');
      expect(auditEvent).not.toHaveProperty('password');
      expect(auditEvent).not.toHaveProperty('body');
      expect(auditEvent).not.toHaveProperty('requestBody');

    } finally {
      (console as any).log = original;
    }
  });

  it('handles missing user context gracefully', () => {
    const captured: string[] = [];
    const original = console.log as any;
    (console as any).log = (arg?: unknown) => { captured.push(String(arg ?? '')); };
    try {
      const mockRequest = {
        get: (header: string) => {
          if (header === 'x-request-id') return '550e8400-e29b-41d4-a716-446655440000';
          return undefined;
        },
        headers: {},
      } as any;

      // No user context (anonymous operation)
      const auditEvent = createAuditEvent(mockRequest as any, 'create', 'post-anon', 201);

      expect(auditEvent.userId).toBeUndefined();
      expect(auditEvent.role).toBeUndefined();
      expect(auditEvent.targetId).toBe('post-anon');
      expect(auditEvent.status).toBe(201);

    } finally {
      (console as any).log = original;
    }
  });
});
