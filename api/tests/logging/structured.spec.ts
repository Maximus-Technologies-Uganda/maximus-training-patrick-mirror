import { describe, expect, it, jest } from '@jest/globals';
import { REDACTED } from '../../src/logging/redaction';
import {
  emitStructuredLog,
  logInfo,
  logWarn,
  type StructuredLogOptions,
} from '../../src/logging/structured';
import {
  APPLICATION_LOG_RETENTION_DAYS,
  AUDIT_LOG_RETENTION_DAYS,
} from '../../src/logging/retention';

describe('structured logging helpers', () => {
  it('sanitizes sensitive data and writes to stdout for info level', () => {
    const writes: string[] = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = jest.fn((chunk: string | Uint8Array) => {
      writes.push(chunk.toString());
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      logInfo('user login', {
        authorization: 'Bearer secret-token',
        context: { email: 'user@example.com' },
      });

      expect(writes).toHaveLength(1);
      const entry = JSON.parse(writes[0]);
      expect(entry.level).toBe('info');
      expect(entry.msg).toBe('user login');
      expect(entry.message).toBe('user login');
      expect(entry.service).toBe('api');
      expect(entry.authorization).toBe(REDACTED);
      expect(entry.retentionDays).toBe(APPLICATION_LOG_RETENTION_DAYS);
      const context = entry.context as { email: string };
      expect(context.email).toBe(REDACTED);
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  it('routes warnings to stderr with retention metadata', () => {
    const writes: string[] = [];
    const originalStderr = process.stderr.write;
    process.stderr.write = jest.fn((chunk: string | Uint8Array) => {
      writes.push(chunk.toString());
      return true;
    }) as unknown as typeof process.stderr.write;

    try {
      logWarn('configuration issue', { token: 'abc123' });

      expect(writes).toHaveLength(1);
      const entry = JSON.parse(writes[0]);
      expect(entry.level).toBe('warn');
      expect(entry.msg).toBe('configuration issue');
      expect(entry.token).toBe(REDACTED);
      expect(entry.retentionDays).toBe(APPLICATION_LOG_RETENTION_DAYS);
    } finally {
      process.stderr.write = originalStderr;
    }
  });

  it('supports audit retention when explicitly requested', () => {
    const writes: string[] = [];
    const originalStdout = process.stdout.write;
    process.stdout.write = jest.fn((chunk: string | Uint8Array) => {
      writes.push(chunk.toString());
      return true;
    }) as unknown as typeof process.stdout.write;

    try {
      const options: StructuredLogOptions = { retention: 'audit', service: 'api-audit' };
      emitStructuredLog('info', 'audit event', { actor: 'user-123' }, options);

      expect(writes).toHaveLength(1);
      const entry = JSON.parse(writes[0]);
      expect(entry.service).toBe('api-audit');
      expect(entry.retentionDays).toBe(AUDIT_LOG_RETENTION_DAYS);
      expect(entry.actor).toBe('user-123');
    } finally {
      process.stdout.write = originalStdout;
    }
  });
});
