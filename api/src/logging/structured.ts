import type { Writable } from 'node:stream';
import { sanitizeLogEntry } from './redaction';
import { withApplicationLogRetention, withAuditLogRetention } from './retention';

export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';
export type StructuredLogRetention = 'application' | 'audit';

export interface StructuredLogOptions {
  readonly service?: string;
  readonly timestamp?: Date | string;
  readonly retention?: StructuredLogRetention;
  readonly stream?: 'stdout' | 'stderr';
}

export type StructuredLogFields = Record<string, unknown>;

const DEFAULT_SERVICE = 'api' as const;
const DEFAULT_RETENTION: StructuredLogRetention = 'application';

function resolveTimestamp(timestamp?: Date | string): string {
  if (typeof timestamp === 'string' && timestamp.trim().length > 0) {
    return timestamp;
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
}

function resolveStream(name: 'stdout' | 'stderr'): Writable {
  return name === 'stderr' ? process.stderr : process.stdout;
}

function applyRetention(
  entry: StructuredLogFields,
  retention: StructuredLogRetention,
): StructuredLogFields {
  return retention === 'audit'
    ? (withAuditLogRetention(entry) as StructuredLogFields)
    : (withApplicationLogRetention(entry) as StructuredLogFields);
}

function safeSerialize(entry: StructuredLogFields): string | undefined {
  try {
    return JSON.stringify(entry);
  } catch {
    return undefined;
  }
}

function sanitizeFields(fields?: StructuredLogFields): StructuredLogFields {
  if (!fields) {
    return {};
  }
  const extras: StructuredLogFields = { ...fields };
  delete extras.level;
  delete extras.msg;
  delete extras.message;
  delete extras.service;
  delete extras.ts;
  delete extras.retentionDays;
  return extras;
}

export function emitStructuredLog(
  level: StructuredLogLevel,
  message: string,
  fields: StructuredLogFields = {},
  options: StructuredLogOptions = {},
): void {
  try {
    const streamName =
      options.stream ?? (level === 'error' || level === 'warn' ? 'stderr' : 'stdout');
    const stream = resolveStream(streamName);
    const timestamp = resolveTimestamp(options.timestamp);
    const service =
      options.service && options.service.trim().length > 0 ? options.service : DEFAULT_SERVICE;
    const extras = sanitizeFields(fields);
    const baseEntry: StructuredLogFields = {
      ts: timestamp,
      level,
      msg: message,
      message,
      service,
      ...extras,
    };
    const retention = options.retention ?? DEFAULT_RETENTION;
    const entryWithRetention = applyRetention(baseEntry, retention);
    const sanitized = sanitizeLogEntry(entryWithRetention) as StructuredLogFields;
    const serialized = safeSerialize(sanitized);
    if (!serialized) {
      return;
    }
    stream.write(`${serialized}\n`);
  } catch {
    // Logging should never throw; swallow errors to avoid impacting request flow.
  }
}

export function logDebug(
  message: string,
  fields: StructuredLogFields = {},
  options: StructuredLogOptions = {},
): void {
  emitStructuredLog('debug', message, fields, { ...options, stream: options.stream ?? 'stdout' });
}

export function logInfo(
  message: string,
  fields: StructuredLogFields = {},
  options: StructuredLogOptions = {},
): void {
  emitStructuredLog('info', message, fields, { ...options, stream: options.stream ?? 'stdout' });
}

export function logWarn(
  message: string,
  fields: StructuredLogFields = {},
  options: StructuredLogOptions = {},
): void {
  emitStructuredLog('warn', message, fields, { ...options, stream: options.stream ?? 'stderr' });
}

export function logError(
  message: string,
  fields: StructuredLogFields = {},
  options: StructuredLogOptions = {},
): void {
  emitStructuredLog('error', message, fields, { ...options, stream: options.stream ?? 'stderr' });
}
