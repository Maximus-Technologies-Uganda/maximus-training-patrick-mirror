import type { RequestHandler } from "express";
import { setCacheControlNoStore } from "../lib/errors";

let admin: typeof import("firebase-admin") | null = null;
type JoseModule = typeof import("jose");
type RemoteJwkSet = ReturnType<JoseModule["createRemoteJWKSet"]>;

let joseModulePromise: Promise<JoseModule> | null = null;
let firebaseRemoteJwkSet: RemoteJwkSet | null = null;

async function getJoseModule(): Promise<JoseModule> {
  if (!joseModulePromise) {
    joseModulePromise = import("jose");
  }
  return joseModulePromise;
}

async function getFirebaseRemoteJwkSet(): Promise<{ jose: JoseModule; jwks: RemoteJwkSet }> {
  const jose = await getJoseModule();
  if (!firebaseRemoteJwkSet) {
    firebaseRemoteJwkSet = jose.createRemoteJWKSet(
      new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
    );
  }
  return { jose, jwks: firebaseRemoteJwkSet };
}

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v : undefined;
}

async function ensureFirebaseAdmin(): Promise<void> {
  if (admin) return;
  try {
    const mod = (await import("firebase-admin")) as typeof import("firebase-admin");
    admin = mod;
    const projectId = getEnv("FIREBASE_ADMIN_PROJECT_ID");
    const clientEmail = getEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
    const privateKey = getEnv("FIREBASE_ADMIN_PRIVATE_KEY");
    if (!admin?.apps?.length) {
      admin?.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        } as unknown as import("firebase-admin").ServiceAccount),
      });
    }
  } catch {
    // leave admin as null; downstream middleware will fall back to other auth mechanisms
  }
}

function base64UrlToBase64(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return normalized + "=".repeat(pad);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  const payloadSegment = segments[1];
  try {
    const json = Buffer.from(base64UrlToBase64(payloadSegment), "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function withinClockSkew(nowSec: number, targetSec: number, skewSec: number): boolean {
  return Math.abs(nowSec - targetSec) <= skewSec;
}

type FirebaseDecodedIdToken = {
  [key: string]: unknown;
  iss: string;
  sub: string;
  uid: string;
  aud?: string | string[];
  auth_time?: number | string;
  iat?: number | string;
  exp?: number | string;
};

function normalizeAudience(aud: unknown): string | undefined {
  if (typeof aud === "string" && aud.trim()) return aud;
  if (Array.isArray(aud)) {
    const first = aud.find((value): value is string => typeof value === "string" && value.trim().length > 0);
    return first;
  }
  return undefined;
}

function normalizeNumericClaim(value: unknown): number | null {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractAuthTimeSeconds(decoded: FirebaseDecodedIdToken): number | null {
  const authTime = typeof decoded.auth_time === "number" ? decoded.auth_time : Number(decoded.auth_time);
  if (Number.isFinite(authTime)) {
    return Math.trunc(authTime);
  }
  const iat = typeof decoded.iat === "number" ? decoded.iat : Number(decoded.iat);
  if (Number.isFinite(iat)) {
    return Math.trunc(iat);
  }
  return null;
}

function resolveFirebaseProjectId(): string | undefined {
  return (
    getEnv("FIREBASE_ADMIN_PROJECT_ID") ||
    getEnv("FIREBASE_AUTH_PROJECT_ID") ||
    getEnv("FIREBASE_PROJECT_ID") ||
    getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID") ||
    getEnv("GCP_PROJECT_ID")
  );
}

async function verifyTokenWithClockTolerance(token: string, skewSeconds: number): Promise<FirebaseDecodedIdToken> {
  if (!admin) {
    throw new Error("firebase-admin-unavailable");
  }
  const { jose, jwks } = await getFirebaseRemoteJwkSet();
  const projectId = resolveFirebaseProjectId();
  const verifyOptions: Parameters<JoseModule["jwtVerify"]>[2] = {
    clockTolerance: skewSeconds,
    algorithms: ["RS256"],
  };
  if (projectId) {
    verifyOptions.issuer = [`https://securetoken.google.com/${projectId}`, "https://accounts.google.com"];
    verifyOptions.audience = projectId;
  } else {
    verifyOptions.issuer = ["https://accounts.google.com"];
  }

  const { payload } = await jose.jwtVerify(token, jwks, verifyOptions);
  const iss = typeof payload.iss === "string" ? payload.iss : "";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!iss || !sub) {
    throw new Error("invalid-claims");
  }
  const aud = normalizeAudience(payload.aud);
  if (projectId) {
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (iss !== expectedIssuer && iss !== "https://accounts.google.com") {
      throw new Error("invalid-issuer");
    }
    if (aud && aud !== projectId) {
      throw new Error("invalid-audience");
    }
  }

  const decoded: FirebaseDecodedIdToken = {
    ...(payload as Record<string, unknown>),
    iss,
    sub,
    uid: sub,
  };

  if (aud) {
    decoded.aud = aud;
  }

  return decoded;
}

async function ensureTokenNotRevoked(decoded: FirebaseDecodedIdToken): Promise<void> {
  if (!admin) {
    throw new Error("firebase-admin-unavailable");
  }
  const userRecord = await admin.auth().getUser(decoded.sub);
  if (userRecord.disabled) {
    throw new Error("user-disabled");
  }
  if (userRecord.tokensValidAfterTime) {
    const validAfter = Date.parse(userRecord.tokensValidAfterTime);
    if (Number.isFinite(validAfter)) {
      const authTimeSec = extractAuthTimeSeconds(decoded);
      if (authTimeSec === null || authTimeSec * 1000 < validAfter) {
        throw new Error("token-revoked");
      }
    }
  }
}

export function isFirebaseIdTokenCandidate(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  const iss = typeof payload.iss === "string" ? payload.iss : "";
  const aud = typeof payload.aud === "string" ? payload.aud : "";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub) return false;

  const projectId = resolveFirebaseProjectId();
  if (projectId) {
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    const allowedIssuers = new Set([expectedIssuer, "https://accounts.google.com"]);
    if (!allowedIssuers.has(iss)) return false;
    if (aud && aud !== projectId) return false;
    return true;
  }

  if (iss === "https://accounts.google.com") return true;
  if (iss.startsWith("https://securetoken.google.com/")) return true;
  return false;
}

export const verifyFirebaseIdToken: RequestHandler = async (req, res, next) => {
  await ensureFirebaseAdmin();
  const authz = (req.get("Authorization") || req.headers["authorization"]) as string | undefined;
  if (!authz || !authz.startsWith("Bearer ")) {
    return next(); // allow fallback auth (e.g., cookie-based) to run after
  }

  const token = authz.slice("Bearer ".length);

  if (!isFirebaseIdTokenCandidate(token)) {
    return next();
  }

  if (!admin) {
    return next();
  }

  const requestId = (res.locals.requestId || (req as unknown as { requestId?: string }).requestId) as string | undefined;
  const unauthorizedResponse = () => {
    setCacheControlNoStore(res, 401);
    return res
      .status(401)
      .json({ code: "unauthorized", message: "Unauthorized", ...(requestId ? { requestId } : {}) });
  };

  const skew = 300; // 5 minutes
  try {
    const decoded = await verifyTokenWithClockTolerance(token, skew);
    await ensureTokenNotRevoked(decoded);

    const nowSec = Math.floor(Date.now() / 1000);
    const exp = normalizeNumericClaim(decoded.exp);
    if (exp !== null && nowSec > exp + skew) {
      return unauthorizedResponse();
    }
    const iat = normalizeNumericClaim(decoded.iat);
    if (iat !== null && iat > nowSec + skew) {
      return unauthorizedResponse();
    }

    const iss = typeof decoded.iss === "string" ? decoded.iss : "";
    const aud = normalizeAudience(decoded.aud);
    const sub = typeof decoded.sub === "string" ? decoded.sub : "";
    if (!iss || !aud || !sub) {
      return unauthorizedResponse();
    }

    // Extract role from Firebase custom claims if available with safe narrowing
    const pick = (obj: unknown, key: string): unknown => {
      return obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)
        ? (obj as Record<string, unknown>)[key]
        : undefined;
    };
    const roleDirect = pick(decoded, 'role');
    const customClaims = pick(decoded, 'custom_claims');
    const roleFromCustom = customClaims && typeof customClaims === 'object' ? (customClaims as Record<string, unknown>)['role'] : undefined;
    const resolvedRole = typeof roleDirect === 'string'
      ? roleDirect
      : (typeof roleFromCustom === 'string' ? roleFromCustom : 'owner');

    (req as unknown as { user?: { userId: string; role?: string } }).user = {
      userId: sub,
      role: resolvedRole
    };
    (req as unknown as { authContext?: { method?: string } }).authContext = {
      method: "firebase-bearer",
    };
    return next();
  } catch {
    return unauthorizedResponse();
  }
};

export default verifyFirebaseIdToken;
