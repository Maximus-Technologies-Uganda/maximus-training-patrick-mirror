import { describe, expect, it } from '@jest/globals';
import {
  APPLICATION_LOG_RETENTION_DAYS,
  AUDIT_LOG_RETENTION_DAYS,
  enforceRetention,
  withApplicationLogRetention,
  withAuditLogRetention,
} from '../../src/logging/retention';

describe('log retention helpers', () => {
  it('enforces application log retention of 30 days', () => {
    const entry = withApplicationLogRetention({ msg: 'test' });
    expect(entry.retentionDays).toBe(APPLICATION_LOG_RETENTION_DAYS);
  });

  it('enforces audit log retention of 90 days', () => {
    const entry = withAuditLogRetention({ type: 'audit' });
    expect(entry.retentionDays).toBe(AUDIT_LOG_RETENTION_DAYS);
  });

  it('normalizes custom enforcement values', () => {
    const enforced = enforceRetention({ event: 'custom' }, 45.7);
    expect(enforced.retentionDays).toBe(45);
  });

  it('rejects non-positive retention days', () => {
    expect(() => enforceRetention({ event: 'bad' }, 0)).toThrow(RangeError);
  });
});
