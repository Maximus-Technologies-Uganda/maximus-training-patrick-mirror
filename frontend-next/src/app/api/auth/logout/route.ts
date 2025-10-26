import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getIdToken } from "../../../../server/auth/getIdToken";

const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const runtime = "nodejs";

function isHttps(request: NextRequest): boolean {
  try {
    const xfProto = (request.headers.get("x-forwarded-proto") || "").toLowerCase();
    if (xfProto.includes("https")) return true;
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
  } catch {}
  return false;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = new URL("/auth/logout", API_BASE_URL).toString();
  try {
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId.trim() : randomUUID();
    const audience = process.env.IAP_AUDIENCE || process.env.ID_TOKEN_AUDIENCE || "";
    const headers: Record<string, string> = { "X-Request-Id": requestId };
    if (audience) headers.Authorization = `Bearer ${await getIdToken(audience)}`;
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers,
    });
    // Forward cookie clearing headers; upstream may clear multiple cookies
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
      const res = new NextResponse(null, { status: upstreamResponse.status });
      for (const cookie of setCookieValues) res.headers.append("set-cookie", cookie);
      const upstreamRequestId = upstreamResponse.headers.get("x-request-id") || requestId;
      res.headers.set("X-Request-Id", upstreamRequestId);
      return res;
    }
    const upstreamRequestId = upstreamResponse.headers.get("x-request-id") || requestId;
    return new NextResponse(null, { status: upstreamResponse.status, headers: { "X-Request-Id": upstreamRequestId } });
  } catch (error) {
    // Fallback for local/CI: always clear the session cookie
    if (process.env.NODE_ENV !== "production") {
      const incomingReqId = request.headers.get("x-request-id") || "";
      const requestId = incomingReqId.trim() ? incomingReqId.trim() : randomUUID();
      const res = new NextResponse(null, { status: 204, headers: { "X-Request-Id": requestId } });
      const secureAttr = isHttps(request) ? "; Secure" : "";
      // Clear both session and csrf cookies (T048)
      res.headers.append("set-cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureAttr}`);
      res.headers.append("set-cookie", `csrf=; Path=/; SameSite=Strict; Max-Age=0${secureAttr}`);
      return res;
    }
    // Structured error for logs/telemetry
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId.trim() : randomUUID();
    const errInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : String(error);
    console.error(JSON.stringify({ level: "error", msg: "POST /api/auth/logout upstream error", upstreamUrl, requestId, error: errInfo }));
    return NextResponse.json(
      { error: { code: "UPSTREAM_LOGOUT_FAILED", message: "Failed to logout" } },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}


