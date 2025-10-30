import { Router } from "express";

export type DependencyStatus = "ok" | "down" | "degraded";

export type DependencyChecker = () => Promise<DependencyStatus> | DependencyStatus;

export interface HealthOptions {
  serviceName?: string;
  commitSha?: string;
  dependencyChecks?: Record<string, DependencyChecker>;
  now?: () => Date;
  uptimeSeconds?: () => number;
  retryAfterSeconds?: number;
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

async function evaluateDependencies(
  checks: Record<string, DependencyChecker>,
): Promise<{ statuses: Record<string, DependencyStatus>; healthy: boolean }> {
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, check]) => {
      try {
        const result = await check();
        return [name, result] as const;
      } catch {
        return [name, "down"] as const;
      }
    }),
  );
  const statuses: Record<string, DependencyStatus> = {};
  let healthy = true;
  for (const [name, status] of entries) {
    statuses[name] = status;
    if (status === "down") healthy = false;
  }
  return { statuses, healthy };
}

export function createHealthRouter(options: HealthOptions = {}): Router {
  const router = Router();
  const dependencyChecks: Record<string, DependencyChecker> =
    options.dependencyChecks ?? {
      firebase: async () => "ok" as const,
      db: async () => "ok" as const,
    };

  router.get("/health", async (_req, res) => {
    const { statuses, healthy } = await evaluateDependencies(dependencyChecks);
    const now = options.now ? options.now() : new Date();
    const uptimeProvider = options.uptimeSeconds ?? (() => process.uptime());
    const uptimeSeconds = uptimeProvider();
    const retryAfterSeconds = Math.max(1, Math.round(options.retryAfterSeconds ?? 60));

    const payload = {
      service: options.serviceName ?? "api",
      status: healthy ? "ok" : "error",
      commit: resolveCommitSha(options.commitSha),
      time: now.toISOString(),
      uptime_s: Math.max(0, Math.round(uptimeSeconds)),
      dependencies: statuses,
    } as const;

    res.setHeader("Cache-Control", "no-store");
    res.status(healthy ? 200 : 503);
    if (!healthy) {
      res.set("Retry-After", String(retryAfterSeconds));
    }
    res.type("application/json; charset=utf-8");
    res.json(payload);
  });

  return router;
}

export default createHealthRouter;
