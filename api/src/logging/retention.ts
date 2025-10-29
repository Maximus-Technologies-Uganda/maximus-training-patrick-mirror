export const APPLICATION_LOG_RETENTION_DAYS = 30;
export const AUDIT_LOG_RETENTION_DAYS = 90;

function normalizeRetentionDays(retentionDays: number): number {
  if (!Number.isFinite(retentionDays)) {
    throw new TypeError('retentionDays must be a finite number');
  }
  const normalized = Math.trunc(retentionDays);
  if (normalized <= 0) {
    throw new RangeError('retentionDays must be greater than zero');
  }
  return normalized;
}

export function enforceRetention<T extends Record<string, unknown>>(
  entry: T,
  retentionDays: number,
): T & { retentionDays: number } {
  const normalized = normalizeRetentionDays(retentionDays);
  return {
    ...entry,
    retentionDays: normalized,
  };
}

export function withApplicationLogRetention<T extends Record<string, unknown>>(
  entry: T,
): T & { retentionDays: typeof APPLICATION_LOG_RETENTION_DAYS } {
  return enforceRetention(entry, APPLICATION_LOG_RETENTION_DAYS) as T & {
    retentionDays: typeof APPLICATION_LOG_RETENTION_DAYS;
  };
}

export function withAuditLogRetention<T extends Record<string, unknown>>(
  entry: T,
): T & { retentionDays: typeof AUDIT_LOG_RETENTION_DAYS } {
  return enforceRetention(entry, AUDIT_LOG_RETENTION_DAYS) as T & {
    retentionDays: typeof AUDIT_LOG_RETENTION_DAYS;
  };
}
