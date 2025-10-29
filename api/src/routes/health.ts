import { Router, type Response } from "express";

export type DependencyStatus = "ok" | "down" | "degraded";

export type DependencyChecker = () => Promise<DependencyStatus> | DependencyStatus;

export interface HealthOptions {
  serviceName?: string;
  commitSha?: string;
  dependencyChecks?: Record<string, DependencyChecker>;
  now?: () => Date;
  uptimeSeconds?: () => number;
  retryAfterSeconds?: number;
  dependencyTimeoutMs?: number;
  cacheTtlMs?: number;
}

function resolveCommitSha(explicit?: string): string {
  const envCandidates = [
    explicit,
    process.env.COMMIT_SHA,
    process.env.GIT_COMMIT_SHA,
    process.env.GITHUB_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.SOURCE_VERSION,
  ];
  const value = envCandidates.find((entry) => typeof entry === "string" && entry.trim().length > 0);
  return value?.trim() ?? "local";
}

function normalizeDependencyStatus(value: unknown): DependencyStatus {
  if (value === "ok" || value === "degraded" || value === "down") {
    return value;
  }
  return "down";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Dependency check timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function evaluateDependencies(
  checks: Record<string, DependencyChecker>,
  timeoutMs: number,
): Promise<{ statuses: Record<string, DependencyStatus>; healthy: boolean }> {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, check]) => {
      try {
        const result = await withTimeout(Promise.resolve(check()), timeoutMs);
        return [name, normalizeDependencyStatus(result)] as const;
      } catch {
        return [name, "down"] as const;
      }
    }),
  );
  const statuses: Record<string, DependencyStatus> = {};
  let healthy = true;
  for (const [name, status] of entries) {
    statuses[name] = status;
    if (status !== "ok") healthy = false;
  }
  return { statuses, healthy };
}

interface HealthResponsePayload {
  service: string;
  status: "ok" | "error";
  commit: string;
  time: string;
  uptime_s: number;
  dependencies: Record<string, DependencyStatus>;
}

interface CachedHealthResponse {
  statusCode: number;
  payload: HealthResponsePayload;
  retryAfterSeconds?: number;
}

function sendHealthResponse(res: Response, response: CachedHealthResponse): void {
  res.setHeader("Cache-Control", "no-store");
  if (typeof response.retryAfterSeconds === "number") {
    res.set("Retry-After", String(response.retryAfterSeconds));
  } else {
    res.removeHeader("Retry-After");
  }
  res.status(response.statusCode);
  res.type("application/json; charset=utf-8");
  res.json(response.payload);
}

export function createHealthRouter(options: HealthOptions = {}): Router {
  const router = Router();
  const dependencyChecks: Record<string, DependencyChecker> =
    options.dependencyChecks ?? {
      firebase: async () => "ok" as const,
      db: async () => "ok" as const,
    };
  const dependencyTimeoutMs = Math.max(1, options.dependencyTimeoutMs ?? 5000);
  const cacheTtlMs = Math.max(0, options.cacheTtlMs ?? 5000);
  const nowProvider = options.now ?? (() => new Date());
  const uptimeProvider = options.uptimeSeconds ?? (() => process.uptime());
  let cached: { expiresAt: number; response: CachedHealthResponse } | undefined;

  router.get("/health", async (_req, res) => {
    const now = nowProvider();
    const nowMs = now.getTime();

    if (cacheTtlMs > 0 && cached && cached.expiresAt > nowMs) {
      sendHealthResponse(res, cached.response);
      return;
    }

    const { statuses, healthy } = await evaluateDependencies(dependencyChecks, dependencyTimeoutMs);
    const uptimeSeconds = uptimeProvider();
    const retryAfterSeconds = healthy ? undefined : Math.max(1, Math.round(options.retryAfterSeconds ?? 60));

    const payload: HealthResponsePayload = {
      service: options.serviceName ?? "api",
      status: healthy ? "ok" : "error",
      commit: resolveCommitSha(options.commitSha),
      time: now.toISOString(),
      uptime_s: Math.max(0, Math.round(uptimeSeconds)),
      dependencies: statuses,
    };

    const response: CachedHealthResponse = {
      statusCode: healthy ? 200 : 503,
      payload,
      retryAfterSeconds,
    };

    if (cacheTtlMs > 0) {
      cached = { expiresAt: nowMs + cacheTtlMs, response };
    }

    sendHealthResponse(res, response);
  });

  return router;
}

export default createHealthRouter;
