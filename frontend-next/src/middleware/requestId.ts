const TRACEPARENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

export interface RequestContext {
  requestId: string;
  traceparent: string;
  traceId: string;
  tracestate?: string;
}

interface TraceParseResult {
  traceparent: string;
  traceId: string;
  spanId: string;
  flags: string;
}

function parseTraceparent(value: string | null | undefined): TraceParseResult | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = TRACEPARENT_REGEX.exec(trimmed);
  if (!match) return null;
  const [, traceId, spanId, flags] = match;
  if (!traceId || /^0+$/.test(traceId)) return null;
  if (!spanId || /^0+$/.test(spanId)) return null;
  return {
    traceparent: `00-${traceId.toLowerCase()}-${spanId.toLowerCase()}-${flags.toLowerCase()}`,
    traceId: traceId.toLowerCase(),
    spanId: spanId.toLowerCase(),
    flags: flags.toLowerCase(),
  };
}

function getCrypto(): Crypto {
  const webCrypto = globalThis.crypto;
  if (!webCrypto) {
    throw new Error("Web Crypto API is not available in this environment");
  }
  return webCrypto;
}

function randomHex(bytesLength: number): string {
  const cryptoInstance = getCrypto();
  const buffer = new Uint8Array(bytesLength);
  cryptoInstance.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function generateRequestId(): string {
  const cryptoInstance = getCrypto();
  if (typeof cryptoInstance.randomUUID === "function") {
    return cryptoInstance.randomUUID();
  }
  return randomHex(16);
}

function generateTraceparent(): TraceParseResult {
  const traceId = randomHex(16);
  const spanId = randomHex(8);
  const flags = "01";
  return {
    traceparent: `00-${traceId}-${spanId}-${flags}`,
    traceId,
    spanId,
    flags,
  };
}

export function ensureRequestContext(headers: Headers): RequestContext {
  const incomingRequestId = headers.get("x-request-id");
  const requestId =
    incomingRequestId && incomingRequestId.trim().length > 0
      ? incomingRequestId.trim()
      : generateRequestId();
  const traceparentParsed = parseTraceparent(headers.get("traceparent"));
  const traceContext = traceparentParsed ?? generateTraceparent();
  const tracestate = (() => {
    const raw = headers.get("tracestate");
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })();
  return {
    requestId,
    traceparent: traceContext.traceparent,
    traceId: traceContext.traceId,
    ...(tracestate ? { tracestate } : {}),
  };
}

export function buildPropagationHeaders(context: RequestContext): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Request-Id": context.requestId,
    traceparent: context.traceparent,
  };
  if (context.tracestate) {
    headers.tracestate = context.tracestate;
  }
  return headers;
}

export function mergeUpstreamContext(context: RequestContext, headers: Headers): RequestContext {
  const upstreamRequestId = headers.get("x-request-id");
  const requestId = upstreamRequestId && upstreamRequestId.trim().length > 0 ? upstreamRequestId.trim() : context.requestId;
  const upstreamTraceparent = parseTraceparent(headers.get("traceparent"));
  const tracestateHeader = headers.get("tracestate");
  const tracestate = tracestateHeader && tracestateHeader.trim().length > 0 ? tracestateHeader.trim() : context.tracestate;
  if (!upstreamTraceparent) {
    return {
      requestId,
      traceparent: context.traceparent,
      traceId: context.traceId,
      ...(tracestate ? { tracestate } : {}),
    };
  }
  return {
    requestId,
    traceparent: upstreamTraceparent.traceparent,
    traceId: upstreamTraceparent.traceId,
    ...(tracestate ? { tracestate } : {}),
  };
}

export function responseHeadersFromContext(context: RequestContext): Record<string, string> {
  return buildPropagationHeaders(context);
}

