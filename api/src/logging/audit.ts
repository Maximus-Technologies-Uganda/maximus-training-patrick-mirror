import type { Request } from "express";
import { extractTraceId } from "../lib/tracing";
import { sanitizeLogEntry } from "./redaction";
import { withAuditLogRetention, AUDIT_LOG_RETENTION_DAYS } from "./retention";

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
  retentionDays: typeof AUDIT_LOG_RETENTION_DAYS;
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
  const traceId = extractTraceId((req.get("traceparent") || req.headers["traceparent"]) as string | undefined);
  const defaultOutcome = status >= 200 && status < 300 ? "success" : "denied";
  const event: AuditEvent = withAuditLogRetention({
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
  });
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
    const event = sanitizeLogEntry(createAuditEvent(req, verb, targetId, status, options));
    console.log(JSON.stringify(event));
  } catch {
    // Best-effort only; never throw from audit
  }
}

export default auditPost;
