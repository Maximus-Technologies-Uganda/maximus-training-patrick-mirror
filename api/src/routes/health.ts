import { Router, Request, Response } from 'express';

export type DependencyStatus = 'ok' | 'down' | 'degraded';

export type DependencyCheckResult = {
  status: DependencyStatus;
  detail?: string;
};

export type DependencyChecker = () => Promise<DependencyCheckResult> | DependencyCheckResult;

export interface HealthOptions {
  serviceName?: string;
  commitSha?: string;
  now?: () => Date;
  uptimeSeconds?: () => number;
  retryAfterSeconds?: number;
  dependencyChecks?: Record<string, DependencyChecker>;
  checkDatabase?: DependencyChecker;
}

export interface HealthRouterOptions {
  serviceName?: string;
  commitSha?: string;
  checkFirebase?: DependencyChecker;
  checkDatabase?: DependencyChecker;
  dependencyTimeouts?: Record<string, number>;
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
  const value = envCandidates.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
  return value?.trim() ?? 'local';
}

async function evaluateDependencies(options: HealthRouterOptions): Promise<{
  statuses: Record<string, DependencyStatus>;
  details: Record<string, string>;
  healthy: boolean;
}> {
  const checks: Record<string, DependencyChecker> = {
    firebase:
      options.checkFirebase ??
      (async () => {
        // Check if Firebase project ID is available in production
        if (process.env.NODE_ENV === 'production') {
          const projectId =
            process.env.FIREBASE_ADMIN_PROJECT_ID ||
            process.env.FIREBASE_AUTH_PROJECT_ID ||
            process.env.FIREBASE_PROJECT_ID ||
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
            process.env.GCP_PROJECT_ID;
          if (!projectId) {
            return { status: 'down', detail: 'project id missing' };
          }
        }
        return { status: 'ok' };
      }),
  };

  // Add database check with the key that matches the test expectations
  if (options.checkDatabase) {
    checks.db = options.checkDatabase; // Use 'db' key for test compatibility
  } else {
    checks.db = async () => ({ status: 'ok' });
  }

  const timeouts = options.dependencyTimeouts ?? {};
  const entries = await Promise.all(
    Object.entries(checks).map(async ([name, check]) => {
      try {
        const timeout = timeouts[name] ?? 5000; // Default 5 second timeout
        const result = await Promise.race([
          check(),
          new Promise<DependencyCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout),
          ),
        ]);
        return [name, result] as const;
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown error';
        return [name, { status: 'down' as const, detail }] as const;
      }
    }),
  );

  const statuses: Record<string, DependencyStatus> = {};
  const details: Record<string, string> = {};
  let healthy = true;

  for (const [name, result] of entries) {
    statuses[name] = result.status;
    if (result.detail) {
      details[name] = result.detail;
    }
    if (result.status === 'down') healthy = false;
  }

  return { statuses, details, healthy };
}

export function createHealthRouter(
  options?: HealthOptions,
  routerOptions?: HealthRouterOptions,
): Router {
  // Merge old and new options for backward compatibility
  const mergedOptions: HealthRouterOptions = {
    serviceName: options?.serviceName ?? routerOptions?.serviceName ?? 'api',
    commitSha: options?.commitSha ?? routerOptions?.commitSha,
    checkFirebase: routerOptions?.checkFirebase ?? options?.dependencyChecks?.firebase,
    checkDatabase: routerOptions?.checkDatabase ?? options?.dependencyChecks?.db,
    dependencyTimeouts:
      routerOptions?.dependencyTimeouts ?? (options?.dependencyChecks ? {} : undefined),
    now: options?.now ?? routerOptions?.now,
    uptimeSeconds: options?.uptimeSeconds ?? routerOptions?.uptimeSeconds,
    retryAfterSeconds: options?.retryAfterSeconds ?? routerOptions?.retryAfterSeconds,
  };

  const router = Router();

  router.get('/health', async (req: Request, res: Response) => {
    const { statuses, details, healthy } = await evaluateDependencies(mergedOptions);
    const now = mergedOptions.now ? mergedOptions.now() : new Date();
    const uptimeProvider = mergedOptions.uptimeSeconds ?? (() => process.uptime());
    const uptimeSeconds = uptimeProvider();
    const retryAfterSeconds = Math.max(1, Math.round(mergedOptions.retryAfterSeconds ?? 60));

    const payload = {
      service: mergedOptions.serviceName,
      status: healthy ? 'ok' : 'degraded',
      commit: resolveCommitSha(mergedOptions.commitSha),
      time: now.toISOString(),
      uptime_s: Math.max(0, Math.round(uptimeSeconds)),
      requestId: req.requestId,
      traceId: req.traceId,
      dependencies: {
        ...statuses,
        ...(Object.keys(details).length > 0 && { details }),
      },
    };

    res.setHeader('Cache-Control', 'no-store');
    res.status(healthy ? 200 : 503);
    if (!healthy) {
      res.set('Retry-After', String(retryAfterSeconds));
    }
    res.type('application/json; charset=utf-8');
    res.json(payload);
  });

  return router;
}

export default createHealthRouter;
