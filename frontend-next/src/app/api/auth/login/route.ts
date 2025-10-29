import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getIdToken } from "../../../../server/auth/getIdToken";
import {
  ensureRequestContext,
  buildPropagationHeaders,
  mergeUpstreamContext,
  responseHeadersFromContext,
} from "../../../../middleware/requestId";

// Keep server-only API base URL; fallback to public var for local dev parity
const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const runtime = "nodejs";

function isHttps(request: NextRequest): boolean {
  try {
    const xfProto = (request.headers.get("x-forwarded-proto") || "").toLowerCase();
    if (xfProto.includes("https")) return true;
    // nextUrl is available on NextRequest in app router
    const proto = ((): string => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyReq = request as any;
        const p = anyReq?.nextUrl?.protocol;
        return typeof p === "string" ? p : "";
      } catch {
        return "";
      }
    })();
    if (proto === "https:") return true;
  } catch {
    // ignore
  }
  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = new URL("/auth/login", API_BASE_URL).toString();
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    bodyText = "{}";
  }
  try {
    const context = ensureRequestContext(request.headers);
    const propagationHeaders = buildPropagationHeaders(context);
    // Accept Firebase ID token from client when present; forward as-is upstream
    // to allow upstream API (or BFF API tier) to verify and mint cookies.
    // If absent, body will contain legacy username/password for local fallback.
    const audience = process.env.IAP_AUDIENCE || process.env.ID_TOKEN_AUDIENCE || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...propagationHeaders,
    };
    if (audience) headers.Authorization = `Bearer ${await getIdToken(audience)}`;
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      // Forward raw body text to preserve exact payload
      body: bodyText,
    });
    const upstreamContext = mergeUpstreamContext(context, upstreamResponse.headers);
    const responseHeaders = responseHeadersFromContext(upstreamContext);

    // Propagate Set-Cookie from upstream so cookies are scoped to this app's host.
    // Some upstreams emit multiple cookies (e.g., session + CSRF). Forward them all.
    const getSetCookieValues = (h: Headers): string[] => {
      try {
        const anyHeaders = h as unknown as { getSetCookie?: () => string[]; raw?: () => Record<string, string[]> };
        if (typeof anyHeaders.getSetCookie === "function") {
          const arr = anyHeaders.getSetCookie();
          if (Array.isArray(arr) && arr.length) return arr;
        }
        if (typeof anyHeaders.raw === "function") {
          const raw = anyHeaders.raw();
          const arr = raw && raw["set-cookie"]; // node-fetch style
          if (Array.isArray(arr) && arr.length) return arr as string[];
        }
      } catch {}
      const single = h.get("set-cookie");
      return single ? [single] : [];
    };
    const setCookieValues = getSetCookieValues(upstreamResponse.headers);
    if (setCookieValues.length > 0) {
      const res = new NextResponse(null, { status: upstreamResponse.status, headers: responseHeaders });
      for (const cookie of setCookieValues) res.headers.append("set-cookie", cookie);
      return res;
    }
    return new NextResponse(null, { status: upstreamResponse.status, headers: responseHeaders });
  } catch (error) {
    // Fallback for local/CI when upstream API is unavailable
    // Only activate outside production to avoid masking real errors
    if (process.env.NODE_ENV !== "production") {
      try {
        const parsed = JSON.parse(bodyText || "{}") as { username?: string; password?: string };
        const { username, password } = parsed;
        const isValid =
          (username === "admin" && password === "password") ||
          (username === "alice" && password === "correct-password");
        const context = ensureRequestContext(request.headers);
        const headers = responseHeadersFromContext(context);
        if (!isValid) {
          return new NextResponse(null, { status: 401, headers });
        }
        const userId = username === "admin" ? "admin-1" : "user-alice-1";
        // Minimal unsigned JWT-like token for local decode-only logic (T062)
        const enc = (s: string) => Buffer.from(s).toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
        const header = enc(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const role = username === "admin" ? "admin" : "owner";
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 15 * 60; // 15 minutes expiry to match cookie Max-Age
        const payload = enc(JSON.stringify({
          userId,
          role,
          iat: now,
          exp,
        }));
        const token = `${header}.${payload}.dev`;
        const secureAttr = isHttps(request) ? "; Secure" : "";
        const res = new NextResponse(null, { status: 204, headers });
        // Session cookie (HttpOnly) with rotation (T062)
        res.headers.append(
          "set-cookie",
          `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${15 * 60}${secureAttr}`,
        );
        // CSRF cookie (non-HttpOnly) for double-submit header with timestamp (T063)
        // Format: timestamp-uuid for TTL validation
        const csrfId = randomUUID().replace(/-/g, "");
        const csrfTs = Math.floor(Date.now() / 1000);
        const csrfToken = `${csrfTs}-${csrfId}`;
        res.headers.append(
          "set-cookie",
          `csrf=${csrfToken}; Path=/; SameSite=Strict; Max-Age=${15 * 60}${secureAttr}`,
        );
        return res;
      } catch {
        // noop and fall through to 500
      }
    }
    // Structured error for logs/telemetry
    const context = ensureRequestContext(request.headers);
    const errInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : String(error);
    console.error(
      JSON.stringify({
        level: "error",
        msg: "POST /api/auth/login upstream error",
        upstreamUrl,
        requestId: context.requestId,
        traceparent: context.traceparent,
        error: errInfo,
      }),
    );
    return NextResponse.json(
      { error: { code: "UPSTREAM_LOGIN_FAILED", message: "Failed to authenticate" } },
      { status: 500, headers: responseHeadersFromContext(context) },
    );
  }
}


