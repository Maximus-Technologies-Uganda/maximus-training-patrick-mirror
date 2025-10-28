import type { Request } from "express";

export type AuditVerb = "create" | "update" | "delete";

export interface AuditEvent {
  level: "info";
  type: "audit";
  ts: string;
  verb: AuditVerb;
  targetType: "post";
  targetId: string;
  userId?: string;
  role?: string;
  status: number;
  requestId?: string;
  traceId?: string;
  outcome?: "success" | "denied";
  denialReason?: string;
}

function deriveTraceId(req: Request): string | undefined {
  const explicit = (req.get("x-trace-id") || req.headers["x-trace-id"]) as string | undefined;
  if (explicit) return explicit;
  const traceparent = (req.get("traceparent") || req.headers["traceparent"]) as string | undefined;
  if (typeof traceparent === "string") {
    const parts = traceparent.split("-");
    if (parts.length >= 4 && parts[1] && /^[0-9a-f]{32}$/i.test(parts[1])) {
      return parts[1];
    }
  }
  return undefined;
}

/**
 * Creates an audit event with automatic outcome derivation.
 *
 * @param req - Express request object
 * @param verb - Audit operation type (create, update, delete)
 * @param targetId - ID of the resource being acted upon
 * @param status - HTTP status code of the operation
 * @param options - Optional metadata
 * @param options.outcome - Explicit outcome (overrides auto-derivation based on status)
 * @param options.denialReason - Required when outcome="denied" or status ≥ 400; describes why operation was denied
 * @returns Audit event object ready for logging
 *
 * @remarks
 * - Auto-derives outcome: 2xx status → "success", non-2xx → "denied" (unless explicitly overridden)
 * - Includes requestId and traceId for correlation across distributed systems
 * - Never throws; returns partial event even if request metadata extraction fails
 */
export function createAuditEvent(
  req: Request,
  verb: AuditVerb,
  targetId: string,
  status: number,
  options: { outcome?: "success" | "denied"; denialReason?: string } = {},
): AuditEvent {
  const now = new Date().toISOString();
  const user = (req as unknown as { user?: { userId?: string; role?: string } }).user || {};
  const requestId = (req as unknown as { requestId?: string }).requestId || (req.get("x-request-id") as string | undefined);
  const traceId = deriveTraceId(req);
  const defaultOutcome = status >= 200 && status < 300 ? "success" : "denied";
  const event: AuditEvent = {
    level: "info",
    type: "audit",
    ts: now,
    verb,
    targetType: "post",
    targetId,
    userId: user.userId,
    role: user.role,
    status,
    ...(requestId ? { requestId } : {}),
    ...(traceId ? { traceId } : {}),
    outcome: options.outcome ?? defaultOutcome,
  };
  if (options.denialReason) {
    event.denialReason = options.denialReason;
  }
  return event;
}

/**
 * Emits a structured audit log for a post operation.
 *
 * @param req - Express request object
 * @param verb - Audit operation type
 * @param targetId - Post ID
 * @param status - HTTP status code
 * @param options - Optional outcome and denialReason metadata
 *
 * @remarks
 * - Best-effort logging: never throws even if serialization or logging fails
 * - Logs to stdout as JSON for collection by centralized logging infrastructure
 */
export function auditPost(
  req: Request,
  verb: AuditVerb,
  targetId: string,
  status: number,
  options: { outcome?: "success" | "denied"; denialReason?: string } = {},
): void {
  try {
    const event = createAuditEvent(req, verb, targetId, status, options);
    console.log(JSON.stringify(event));
  } catch {
    // Best-effort only; never throw from audit
  }
}

export default auditPost;
