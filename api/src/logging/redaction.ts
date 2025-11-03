const REDACTED = '[REDACTED]' as const;

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /api\s*key/i,
];
const CONTAINER_KEYS = new Set(['body', 'payload']);
const EMAIL_PATTERN = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/giu;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const BASIC_PATTERN = /\bBasic\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

function getLowerCaseSegment(path: readonly string[], offsetFromEnd = 1): string | undefined {
  const index = path.length - offsetFromEnd;
  if (index < 0) {
    return undefined;
  }
  const segment = path[index];
  return typeof segment === 'string' ? segment.toLowerCase() : undefined;
}

function shouldRedactContainer(path: readonly string[]): boolean {
  const key = getLowerCaseSegment(path);
  if (!key || !CONTAINER_KEYS.has(key)) {
    return false;
  }

  if (key === 'body') {
    const parent = getLowerCaseSegment(path, 2);
    if (parent === 'request' || parent === 'response') {
      return false;
    }
    return true;
  }

  if (key === 'payload') {
    const parent = getLowerCaseSegment(path, 2);
    const grandparent = getLowerCaseSegment(path, 3);
    if (parent === 'events' || grandparent === 'events') {
      return false;
    }
    return true;
  }

  return true;
}

function shouldRedactKey(path: readonly string[]): boolean {
  const lastSegment = path[path.length - 1];
  if (typeof lastSegment === 'string' && shouldRedactContainer(path)) {
    return true;
  }
  return path.some((segment) => SENSITIVE_KEY_PATTERNS.some((regex) => regex.test(segment)));
}

function isWithinRequestOrResponseBody(path: readonly string[]): boolean {
  for (let index = 0; index < path.length; index += 1) {
    const segment = path[index];
    if (typeof segment !== 'string') {
      continue;
    }
    if (segment.toLowerCase() !== 'body') {
      continue;
    }
    const parent = index > 0 ? path[index - 1] : undefined;
    if (typeof parent === 'string') {
      const normalized = parent.toLowerCase();
      if (normalized === 'request' || normalized === 'response') {
        return true;
      }
    }
  }
  return false;
}

function sanitizePrimitive(value: unknown, path: readonly string[]): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  if (isWithinRequestOrResponseBody(path)) {
    return REDACTED;
  }

  let sanitized = value.replace(EMAIL_PATTERN, REDACTED);
  sanitized = sanitized.replace(BEARER_PATTERN, 'Bearer ' + REDACTED);
  sanitized = sanitized.replace(BASIC_PATTERN, 'Basic ' + REDACTED);
  sanitized = sanitized.replace(JWT_PATTERN, REDACTED);
  return sanitized;
}

function sanitizeArray(values: unknown[], path: readonly string[]): unknown[] {
  return values.map((entry, index) => sanitize(entry, [...path, String(index)]));
}

function sanitizeObject(
  record: Record<string, unknown>,
  path: readonly string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const nextPath = [...path, key];
    result[key] = sanitize(value, nextPath);
  }
  return result;
}

export function sanitize(value: unknown, path: readonly string[] = []): unknown {
  if (value == null) return value;
  if (shouldRedactKey(path)) {
    return REDACTED;
  }
  if (Array.isArray(value)) {
    return sanitizeArray(value, path);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    const plain = value as Record<string, unknown>;
    return sanitizeObject(plain, path);
  }
  return sanitizePrimitive(value, path);
}

export function scrubSerializedPayload(serialized: string): string {
  let result = serialized.replace(EMAIL_PATTERN, REDACTED);
  result = result.replace(BEARER_PATTERN, 'Bearer ' + REDACTED);
  result = result.replace(BASIC_PATTERN, 'Basic ' + REDACTED);
  result = result.replace(JWT_PATTERN, REDACTED);
  return result;
}

export { REDACTED };

// Aliases for backward compatibility
export const sanitizeLogEntry = sanitize;
export const redactValue = sanitize;
