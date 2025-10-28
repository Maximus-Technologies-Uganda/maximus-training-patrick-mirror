import express from "express";
import type { Request, Response } from "express";
import { sanitizeLogEntry } from "../logging/redaction";
import { getFirebaseAdmin, resolveFirebaseProjectId } from "../middleware/firebaseAuth";
import type { IPostsRepository } from "../repositories/posts.repository";

type DependencyName = "firebase" | "database";

class DependencyTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`timeout after ${timeoutMs}ms`);
    this.name = "DependencyTimeoutError";
  }
}

function parseTimeoutMs(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return undefined;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number | undefined): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) {
    return promise;
  }
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DependencyTimeoutError(timeoutMs));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function parseBooleanFlag(raw: string | undefined): boolean | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

export type DependencyStatus = "ok" | "down";

export interface DependencyCheckResult {
  status: DependencyStatus;
  detail?: string;
}

export interface HealthRouterOptions {
  serviceName?: string;
  commitSha?: string;
  checkFirebase?: () => Promise<DependencyCheckResult>;
  checkDatabase?: () => Promise<DependencyCheckResult>;
  dependencyTimeoutMs?: number;
  dependencyTimeouts?: Partial<Record<DependencyName, number>>;
  enableFirebaseAdminPing?: boolean;
}

function resolveCommitSha(): string {
  const candidates = [
    process.env.GIT_COMMIT,
    process.env.COMMIT_SHA,
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.GITHUB_SHA,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "unknown";
}

async function runChecker(
  name: DependencyName,
  checker: (() => Promise<DependencyCheckResult>) | undefined,
  timeoutMs: number | undefined,
): Promise<DependencyCheckResult> {
  if (!checker) {
    return { status: "ok" };
  }
  try {
    const result = await withTimeout(checker(), timeoutMs);
    if (result && result.status === "down") {
      return { status: "down", detail: result.detail };
    }
    return { status: "ok" };
  } catch (error) {
    if (error instanceof DependencyTimeoutError) {
      return { status: "down", detail: `${name} timeout after ${error.timeoutMs}ms` };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { status: "down", detail: `${name} error: ${message}` };
  }
}

function defaultFirebaseChecker(enableAdminPing: boolean): () => Promise<DependencyCheckResult> {
  return async () => {
    const projectId = resolveFirebaseProjectId();
    if (!projectId && process.env.NODE_ENV === "production") {
      return { status: "down", detail: "firebase project id missing" };
    }
    if (!enableAdminPing) {
      return { status: "ok" };
    }

    const admin = await getFirebaseAdmin();
    if (!admin) {
      return { status: "down", detail: "firebase admin sdk unavailable" };
    }

    try {
      const activeApp = admin.apps.length > 0 ? admin.app() : null;
      if (!activeApp) {
        return { status: "down", detail: "firebase admin not initialized" };
      }
      const credential = activeApp.options.credential as { getAccessToken?: () => Promise<unknown> } | undefined;
      if (credential?.getAccessToken) {
        await credential.getAccessToken();
      } else {
        await admin.auth().listUsers(1);
      }
      return { status: "ok" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { status: "down", detail: `firebase admin ping failed: ${message}` };
    }
  };
}

function defaultDatabaseChecker(repository: IPostsRepository | undefined): () => Promise<DependencyCheckResult> {
  return async () => {
    if (!repository || typeof repository.count !== "function") {
      return { status: "ok" };
    }
    try {
      await repository.count();
      return { status: "ok" };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { status: "down", detail: `db error: ${message}` };
    }
  };
}

function resolveDependencyTimeouts(options: HealthRouterOptions): Record<DependencyName, number | undefined> {
  const globalTimeout = options.dependencyTimeoutMs ?? parseTimeoutMs(process.env.HEALTHCHECK_TIMEOUT_MS);
  return {
    firebase:
      options.dependencyTimeouts?.firebase ??
      parseTimeoutMs(process.env.HEALTHCHECK_FIREBASE_TIMEOUT_MS) ??
      globalTimeout,
    database:
      options.dependencyTimeouts?.database ??
      parseTimeoutMs(process.env.HEALTHCHECK_DATABASE_TIMEOUT_MS) ??
      globalTimeout,
  };
}

function shouldUseFirebaseAdminPing(options: HealthRouterOptions): boolean {
  if (typeof options.enableFirebaseAdminPing === "boolean") {
    return options.enableFirebaseAdminPing;
  }
  return parseBooleanFlag(process.env.HEALTHCHECK_FIREBASE_ADMIN_PING) ?? false;
}

function buildResponse(
  req: Request,
  res: Response,
  payload: {
    service: string;
    commit: string;
    time: string;
    uptime_s: number;
    dependencies: { firebase: DependencyStatus; db: DependencyStatus; details?: Record<string, string | undefined> };
  },
): Record<string, unknown> {
  const requestId = (res.locals as { requestId?: string }).requestId || (req as { requestId?: string }).requestId;
  const traceId = (res.locals as { traceId?: string }).traceId || (req as { traceId?: string }).traceId;
  const base = {
    service: payload.service,
    status: payload.dependencies.firebase === "ok" && payload.dependencies.db === "ok" ? "ok" : "degraded",
    commit: payload.commit,
    time: payload.time,
    uptime_s: payload.uptime_s,
    dependencies: {
      firebase: payload.dependencies.firebase,
      db: payload.dependencies.db,
    },
  } as Record<string, unknown>;
  if (payload.dependencies.details) {
    base.dependencies = {
      ...(base.dependencies as Record<string, DependencyStatus>),
      details: payload.dependencies.details,
    };
  }
  if (requestId) base.requestId = requestId;
  if (traceId) base.traceId = traceId;
  return base;
}

export function createHealthRouter(
  repository: IPostsRepository | undefined,
  options: HealthRouterOptions = {},
): express.Router {
  const router = express.Router();
  const serviceName = options.serviceName ?? "api";
  const commitSha = options.commitSha ?? resolveCommitSha();
  const enableFirebaseAdminPing = shouldUseFirebaseAdminPing(options);
  const dependencyTimeouts = resolveDependencyTimeouts(options);
  const checkFirebase = options.checkFirebase ?? defaultFirebaseChecker(enableFirebaseAdminPing);
  const checkDatabase = options.checkDatabase ?? defaultDatabaseChecker(repository);

  router.get("/health", async (req, res) => {
    const [firebaseStatus, dbStatus] = await Promise.all([
      runChecker("firebase", checkFirebase, dependencyTimeouts.firebase),
      runChecker("database", checkDatabase, dependencyTimeouts.database),
    ]);

    const dependenciesDetails: Record<string, string | undefined> = {};
    if (firebaseStatus.detail) dependenciesDetails.firebase = firebaseStatus.detail;
    if (dbStatus.detail) dependenciesDetails.db = dbStatus.detail;
    const hasDetails = Object.values(dependenciesDetails).some((value) => value && value.trim().length > 0);

    const responseBody = buildResponse(req, res, {
      service: serviceName,
      commit: commitSha,
      time: new Date().toISOString(),
      uptime_s: Math.round(process.uptime()),
      dependencies: {
        firebase: firebaseStatus.status,
        db: dbStatus.status,
        ...(hasDetails ? { details: dependenciesDetails } : {}),
      },
    });

    const statusCode = firebaseStatus.status === "ok" && dbStatus.status === "ok" ? 200 : 503;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(statusCode).send(JSON.stringify(sanitizeLogEntry(responseBody)));
  });

  return router;
}

export default createHealthRouter;

