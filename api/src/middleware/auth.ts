import type { RequestHandler } from 'express';
import { auditPost, type AuditVerb } from '../logging/audit';
import { ERROR_CODES, sendErrorResponse } from '../lib/errors';

type FirebaseAdminModule = typeof import('firebase-admin');

interface GlobalWithTestHook {
  __TEST_ADMIN_REVOCATION_HOOK__?: (user: RequestUser) => Promise<{ allowed: boolean } | undefined>;
}

type RequestUser = {
  userId?: string;
  role?: string;
  authTime?: number;
};

type RequestWithUser = {
  user?: RequestUser;
  params?: Record<string, unknown>;
};

let firebaseAdminPromise: Promise<FirebaseAdminModule | null> | null = null;

async function loadFirebaseAdmin(): Promise<FirebaseAdminModule | null> {
  if (!firebaseAdminPromise) {
    firebaseAdminPromise = import('firebase-admin')
      .then((mod) => {
        if (!mod.apps.length) {
          try {
            mod.initializeApp();
          } catch {
            // ignore; another part of the app may have initialized already
          }
        }
        return mod;
      })
      .catch(() => null);
  }
  return firebaseAdminPromise;
}

function resolveAuditVerb(method: string): AuditVerb | null {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return null;
  }
}

function resolveTargetId(req: RequestWithUser, verb: AuditVerb | null): string {
  if (verb === 'create') return '';
  const params = req.params;
  const candidate = params && typeof params.id === 'string' ? params.id : undefined;
  return candidate ?? '';
}

function resolveAuthTime(user: RequestUser | undefined): number | null {
  if (!user) return null;
  if (typeof user.authTime === 'number' && Number.isFinite(user.authTime)) {
    return Math.trunc(user.authTime);
  }
  return null;
}

function auditAndDeny(
  req: RequestWithUser,
  res: Parameters<typeof sendErrorResponse>[0],
  verb: AuditVerb | null,
  statusCode: number,
  message: string,
  denialReason: string,
): void {
  const targetId = resolveTargetId(req, verb);
  if (verb) {
    auditPost(req as never, verb, targetId, statusCode, {
      denialReason,
      outcome: 'denied',
    });
  }
  sendErrorResponse(
    res,
    statusCode === 401 ? ERROR_CODES.UNAUTHORIZED : ERROR_CODES.SERVICE_UNAVAILABLE,
    message,
    {
      request: req as never,
      statusCode,
    },
  );
}

export const enforceAdminRevocation: RequestHandler = async (req, res, next) => {
  const requestWithUser = req as unknown as RequestWithUser;
  const user = requestWithUser.user;
  if (!user || user.role !== 'admin') {
    return next();
  }

  // Test hook to bypass Firebase Admin checks in test environment
  const testHook = (global as GlobalWithTestHook).__TEST_ADMIN_REVOCATION_HOOK__;
  if (typeof testHook === 'function') {
    const result = await testHook(user);
    if (result && result.allowed) {
      return next();
    }
  }

  const adminModule = await loadFirebaseAdmin();
  const verb = resolveAuditVerb(req.method || '');
  if (!adminModule) {
    auditAndDeny(
      requestWithUser,
      res,
      verb,
      503,
      'Admin revocation service unavailable',
      'admin-revocation-check-unavailable',
    );
    return;
  }

  const userId =
    typeof user.userId === 'string' && user.userId.trim().length > 0 ? user.userId : null;
  if (!userId) {
    auditAndDeny(
      requestWithUser,
      res,
      verb,
      401,
      'Invalid authentication context',
      'admin-revocation-missing-user-id',
    );
    return;
  }

  try {
    const record = await adminModule.auth().getUser(userId);
    if (record.disabled) {
      auditAndDeny(
        requestWithUser,
        res,
        verb,
        401,
        'Admin access has been revoked',
        'admin-account-disabled',
      );
      return;
    }
    const validAfter = record.tokensValidAfterTime
      ? Date.parse(record.tokensValidAfterTime)
      : Number.NaN;
    const authTime = resolveAuthTime(user);
    if (Number.isFinite(validAfter)) {
      if (authTime === null || authTime * 1000 < validAfter) {
        auditAndDeny(
          requestWithUser,
          res,
          verb,
          401,
          'Admin session has been revoked; please sign in again',
          'admin-token-revoked',
        );
        return;
      }
    }
  } catch {
    // FIX (Gap #6): Improved error message for user-facing clarity
    auditAndDeny(
      requestWithUser,
      res,
      verb,
      503,
      'Unable to verify admin session validity; please retry or contact support',
      'admin-revocation-validation-error',
    );
    return;
  }

  return next();
};

export function resetAdminRevocationCacheForTests(): void {
  firebaseAdminPromise = null;
}

export default enforceAdminRevocation;
