import { Router, Request, Response } from 'express';

export type DependencyStatus = 'ok' | 'down' | 'degraded';

export type DependencyCheckResult = {
  status: DependencyStatus;
  detail?: string;
};

export type DependencyCheckValue = DependencyCheckResult | DependencyStatus | string;

export type DependencyChecker = () => Promise<DependencyCheckValue> | DependencyCheckValue;

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

const DEFAULT_DEPENDENCY_TIMEOUT_MS = 5000;

function normalizeDependencyStatus(value: unknown): DependencyStatus {
  if (typeof value !== 'string') {
    return 'down';
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'down';
  }
  if (
    normalized === 'ok' ||
    normalized === 'healthy' ||
    normalized === 'up' ||
    normalized === 'pass'
  ) {
    return 'ok';
  }
  if (
    normalized === 'degraded' ||
    normalized === 'warn' ||
    normalized === 'warning' ||
    normalized === 'partial'
  ) {
    return 'degraded';
  }
  return 'down';
}

function normalizeDependencyDetail(detail: unknown): string | undefined {
  if (detail === undefined || detail === null) {
    return undefined;
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (detail instanceof Error && detail.message) {
    return detail.message;
  }
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

function coerceCheckResult(name: string, raw: DependencyCheckValue): DependencyCheckResult {
  if (typeof raw === 'string') {
    return { status: normalizeDependencyStatus(raw) };
  }
  if (raw && typeof raw === 'object') {
    const candidate = raw as { status?: unknown; detail?: unknown };
    if (candidate.status !== undefined) {
      const status = normalizeDependencyStatus(candidate.status);
      const detail = normalizeDependencyDetail(candidate.detail);
      return detail ? { status, detail } : { status };
    }
  }
  const detail = name ? `${name} returned an invalid result` : 'invalid dependency result';
  return { status: 'down', detail };
}

function buildTimeoutMap(timeouts?: Record<string, number>): Map<string, number> {
  const map = new Map<string, number>();
  if (!timeouts) {
    return map;
  }
  for (const [rawKey, rawValue] of Object.entries(timeouts)) {
    if (!Number.isFinite(rawValue)) {
      continue;
    }
    const key = rawKey.trim().toLowerCase();
    if (!key) {
      continue;
    }
    const value = Math.max(0, Math.trunc(rawValue));
    map.set(key, value);
    if (key === 'database') {
      map.set('db', value);
    } else if (key === 'db') {
      map.set('database', value);
    }
  }
  return map;
}

function resolveTimeoutMs(name: string, map: Map<string, number>): number {
  if (!name) {
    return DEFAULT_DEPENDENCY_TIMEOUT_MS;
  }
  const key = name.trim().toLowerCase();
  const explicit = map.get(key);
  if (typeof explicit === 'number') {
    return explicit;
  }
  return DEFAULT_DEPENDENCY_TIMEOUT_MS;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('timeout'));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function invokeChecker(
  name: string,
  checker: DependencyChecker,
  timeoutMap: Map<string, number>,
): Promise<DependencyCheckResult> {
  try {
    const timeoutMs = resolveTimeoutMs(name, timeoutMap);
    const result = await withTimeout(Promise.resolve(checker()), timeoutMs);
    return coerceCheckResult(name, result);
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown error';
    return { status: 'down', detail };
  }
}

interface DependencyEvaluation {
  statuses: Record<string, DependencyStatus>;
  details: Record<string, string>;
  hasDown: boolean;
  hasDegraded: boolean;
}

function createDefaultFirebaseChecker(): DependencyChecker {
  return async () => {
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
  };
}

function resolveDependencyConfiguration(
  options?: HealthOptions,
  routerOptions?: HealthRouterOptions,
): {
  checks: Record<string, DependencyChecker>;
  timeoutMap: Map<string, number>;
  useLegacyStatus: boolean;
} {
  const legacyChecks = options?.dependencyChecks ?? {};
  const hasLegacyChecks = Object.keys(legacyChecks).length > 0;

  const checks: Record<string, DependencyChecker> = {};

  for (const [name, checker] of Object.entries(legacyChecks)) {
    if (typeof checker === 'function') {
      checks[name] = checker;
    }
  }

  const firebaseChecker =
    routerOptions?.checkFirebase ??
    (typeof legacyChecks.firebase === 'function' ? legacyChecks.firebase : undefined) ??
    checks.firebase ??
    createDefaultFirebaseChecker();

  checks.firebase = firebaseChecker;

  const legacyDatabaseChecker =
    (typeof legacyChecks.db === 'function' ? legacyChecks.db : undefined) ??
    (typeof (legacyChecks as Record<string, DependencyChecker | undefined>).database === 'function'
      ? (legacyChecks as Record<string, DependencyChecker>).database
      : undefined);

  const databaseChecker =
    routerOptions?.checkDatabase ?? options?.checkDatabase ?? legacyDatabaseChecker;
  if (databaseChecker) {
    checks.db = databaseChecker;
  } else if (!checks.db) {
    checks.db = async () => ({ status: 'ok' });
  }

  const timeoutMap = buildTimeoutMap(routerOptions?.dependencyTimeouts);

  return {
    checks,
    timeoutMap,
    useLegacyStatus: routerOptions === undefined && hasLegacyChecks,
  };
}

async function evaluateDependencies(
  checks: Record<string, DependencyChecker>,
  timeoutMap: Map<string, number>,
): Promise<DependencyEvaluation> {
  const statuses: Record<string, DependencyStatus> = {};
  const details: Record<string, string> = {};
  let hasDown = false;
  let hasDegraded = false;

  for (const [name, checker] of Object.entries(checks)) {
    const result = await invokeChecker(name, checker, timeoutMap);
    statuses[name] = result.status;
    if (result.detail) {
      details[name] = result.detail;
    }
    if (result.status === 'down') {
      hasDown = true;
    } else if (result.status === 'degraded') {
      hasDegraded = true;
    }
  }

  return { statuses, details, hasDown, hasDegraded };
}

export function createHealthRouter(
  options?: HealthOptions,
  routerOptions?: HealthRouterOptions,
): Router {
  const mergedOptions: {
    serviceName: string;
    commitSha?: string;
    now?: () => Date;
    uptimeSeconds?: () => number;
    retryAfterSeconds?: number;
  } = {
    serviceName: options?.serviceName ?? routerOptions?.serviceName ?? 'api',
    commitSha: options?.commitSha ?? routerOptions?.commitSha,
    now: options?.now ?? routerOptions?.now,
    uptimeSeconds: options?.uptimeSeconds ?? routerOptions?.uptimeSeconds,
    retryAfterSeconds: options?.retryAfterSeconds ?? routerOptions?.retryAfterSeconds,
  };

  const { checks, timeoutMap, useLegacyStatus } = resolveDependencyConfiguration(
    options,
    routerOptions,
  );

  const router = Router();

  router.get('/health', async (req: Request, res: Response) => {
    const { statuses, details, hasDown, hasDegraded } = await evaluateDependencies(
      checks,
      timeoutMap,
    );
    const now = mergedOptions.now ? mergedOptions.now() : new Date();
    const uptimeProvider = mergedOptions.uptimeSeconds ?? (() => process.uptime());
    const uptimeSeconds = uptimeProvider();
    const retryAfterSeconds = Math.max(1, Math.round(mergedOptions.retryAfterSeconds ?? 60));
    const aggregateStatus = (() => {
      if (useLegacyStatus) {
        return hasDown || hasDegraded ? ('error' as const) : ('ok' as const);
      }
      if (hasDown || hasDegraded) {
        return 'degraded' as const;
      }
      return 'ok' as const;
    })();
    const statusCode = aggregateStatus === 'ok' ? 200 : 503;
    const dependencies: Record<string, unknown> = { ...statuses };
    if (!useLegacyStatus && Object.keys(details).length > 0) {
      dependencies.details = details;
    }
    const requestId = (req as unknown as { requestId?: string }).requestId;
    const traceId = (req as unknown as { traceId?: string }).traceId;
    const rawRequestIdHeader = req.headers['x-request-id'];
    const rawTraceparentHeader = req.headers['traceparent'];
    const rawTraceIdHeader = req.headers['x-trace-id'];
    const hasExternalRequestId =
      typeof rawRequestIdHeader === 'string' && rawRequestIdHeader.trim().length > 0;
    const hasExternalTraceContext =
      (typeof rawTraceparentHeader === 'string' && rawTraceparentHeader.trim().length > 0) ||
      (typeof rawTraceIdHeader === 'string' && rawTraceIdHeader.trim().length > 0);

    const payload: Record<string, unknown> = {
      service: mergedOptions.serviceName,
      status: aggregateStatus,
      commit: resolveCommitSha(mergedOptions.commitSha),
      time: now.toISOString(),
      uptime_s: Math.max(0, Math.round(uptimeSeconds)),
      dependencies,
    };
    if (requestId && hasExternalRequestId) {
      payload.requestId = requestId;
    }
    if (traceId && hasExternalTraceContext) {
      payload.traceId = traceId;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (statusCode === 503) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
    }

    // Echo upstream tracing context when provided
    if (typeof rawTraceparentHeader === 'string' && rawTraceparentHeader.trim().length > 0) {
      res.setHeader('Traceparent', rawTraceparentHeader.trim());
    }
    const rawTraceStateHeader = req.headers['tracestate'];
    if (typeof rawTraceStateHeader === 'string' && rawTraceStateHeader.trim().length > 0) {
      res.setHeader('Tracestate', rawTraceStateHeader.trim());
    }

    res.status(statusCode).json(payload);
  });

  return router;
}

export default createHealthRouter;
