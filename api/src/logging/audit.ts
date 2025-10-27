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

export function createAuditEvent(req: Request, verb: AuditVerb, targetId: string, status: number): AuditEvent {
  const now = new Date().toISOString();
  const user = (req as unknown as { user?: { userId?: string; role?: string } }).user || {};
  const requestId = (req as unknown as { requestId?: string }).requestId || (req.get("x-request-id") as string | undefined);
  const traceId = deriveTraceId(req);
  return {
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
  };
}

export function auditPost(req: Request, verb: AuditVerb, targetId: string, status: number): void {
  try {
    const event = createAuditEvent(req, verb, targetId, status);
    console.log(JSON.stringify(event));
  } catch {
    // Best-effort only; never throw from audit
  }
}

export default auditPost;
