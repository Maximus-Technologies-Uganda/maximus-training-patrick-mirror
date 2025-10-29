const REDACTED = "[REDACTED]" as const;

const SENSITIVE_KEY_PATTERNS = [/password/i, /secret/i, /token/i, /authorization/i, /cookie/i, /body/i, /email/i];
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const BASIC_PATTERN = /\bBasic\s+[A-Za-z0-9._~+/=-]+/gi;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

function shouldRedactKey(path: readonly string[]): boolean {
  return path.some((segment) => SENSITIVE_KEY_PATTERNS.some((regex) => regex.test(segment)));
}

function sanitizePrimitive(value: unknown, path: readonly string[]): unknown {
  if (typeof value !== "string") {
    return shouldRedactKey(path) ? REDACTED : value;
  }

  if (shouldRedactKey(path)) {
    return REDACTED;
  }

  let sanitized = value.replace(EMAIL_PATTERN, REDACTED);
  sanitized = sanitized.replace(BEARER_PATTERN, "Bearer " + REDACTED);
  sanitized = sanitized.replace(BASIC_PATTERN, "Basic " + REDACTED);
  sanitized = sanitized.replace(JWT_PATTERN, REDACTED);
  return sanitized;
}

function sanitizeArray(values: unknown[], path: readonly string[]): unknown[] {
  return values.map((entry, index) => sanitize(entry, [...path, String(index)]));
}

function sanitizeObject(record: Record<string, unknown>, path: readonly string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const nextPath = [...path, key];
    result[key] = sanitize(value, nextPath);
  }
  return result;
}

export function sanitize(value: unknown, path: readonly string[] = []): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return sanitizeArray(value, path);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    const plain = value as Record<string, unknown>;
    return sanitizeObject(plain, path);
  }
  return sanitizePrimitive(value, path);
}

export function scrubSerializedPayload(serialized: string): string {
  let result = serialized.replace(EMAIL_PATTERN, REDACTED);
  result = result.replace(BEARER_PATTERN, "Bearer " + REDACTED);
  result = result.replace(BASIC_PATTERN, "Basic " + REDACTED);
  result = result.replace(JWT_PATTERN, REDACTED);
  return result;
}

export { REDACTED };
