const REDACTED = "[redacted]" as const;

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "token",
  "password",
  "body",
  "payload",
]);

const EMAIL_DETECTION_REGEX = /([\p{L}\p{N}._%+-]+)@([\p{L}\p{N}.-]+\.[\p{L}]{2,})/iu;
const EMAIL_REDACTION_REGEX = /([\p{L}\p{N}._%+-]+)@([\p{L}\p{N}.-]+\.[\p{L}]{2,})/giu;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeBase64Url(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padding), "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function isLikelyJwt(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  if (!parts.every((segment) => /^[A-Za-z0-9_-]{6,}$/.test(segment))) return false;
  try {
    const headerJson = decodeBase64Url(parts[0]);
    const payloadJson = decodeBase64Url(parts[1]);
    const header = JSON.parse(headerJson);
    const payload = JSON.parse(payloadJson);
    if (!isRecord(header) || !isRecord(payload)) return false;
    const hasAlg = typeof header.alg === "string" && header.alg.length > 0;
    const headerTyp = typeof header.typ === "string" ? header.typ.toUpperCase() : undefined;
    const typLooksJwt = headerTyp ? ["JWT", "JOSE"].includes(headerTyp) : true;
    const hasJwtClaim = ["sub", "iss", "aud", "exp", "iat", "nbf", "jti"].some((claim) => claim in payload);
    return hasAlg && (typLooksJwt || hasJwtClaim);
  } catch {
    return false;
  }
}

function isLikelyToken(value: string): boolean {
  if (value.length < 20) return false;
  if (isLikelyJwt(value)) return true;
  return /bearer\s+/i.test(value) || /api[_-]?key/i.test(value) || /secret/i.test(value);
}

function redactString(value: string): string {
  if (!value) return value;
  if (/^\*+$/.test(value.trim())) {
    return REDACTED;
  }
  if (EMAIL_DETECTION_REGEX.test(value)) {
    return value.replace(EMAIL_REDACTION_REGEX, `${REDACTED}`);
  }
  if (isLikelyToken(value)) return REDACTED;
  if (/session=|csrf=|token=/i.test(value)) return REDACTED;
  return value;
}

function redactArray(value: unknown[]): unknown[] {
  return value.map((item) => redactValue(item));
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower)) {
      result[key] = REDACTED;
      continue;
    }
    result[key] = redactValue(value);
  }
  return result;
}

export function redactValue<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === "string") return redactString(value) as unknown as T;
  if (Array.isArray(value)) return redactArray(value) as unknown as T;
  if (typeof value === "object") {
    return redactObject(value as Record<string, unknown>) as unknown as T;
  }
  return value;
}

export function sanitizeLogEntry<T>(entry: T): T {
  if (entry == null) return entry;
  if (typeof entry === "object" && !Array.isArray(entry)) {
    return redactObject(entry as Record<string, unknown>) as unknown as T;
  }
  return redactValue(entry);
}

export { REDACTED };

