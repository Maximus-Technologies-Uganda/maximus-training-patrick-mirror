import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = new URL("/auth/logout", API_BASE_URL).toString();
  try {
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId.trim() : crypto.randomUUID();
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "X-Request-Id": requestId,
      },
    });
    // Forward cookie clearing header
    const setCookie = upstreamResponse.headers.get("set-cookie");
    if (setCookie) {
      const res = new NextResponse(null, { status: upstreamResponse.status });
      res.headers.set("set-cookie", setCookie);
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
      const requestId = incomingReqId.trim() ? incomingReqId.trim() : crypto.randomUUID();
      const res = new NextResponse(null, { status: 204, headers: { "X-Request-Id": requestId } });
      res.headers.set("set-cookie", `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
      return res;
    }
    console.error("POST /api/auth/logout upstream error", { upstreamUrl, error });
    const incomingReqId = request.headers.get("x-request-id") || "";
    const requestId = incomingReqId.trim() ? incomingReqId.trim() : crypto.randomUUID();
    return NextResponse.json(
      { error: { code: "UPSTREAM_LOGOUT_FAILED", message: "Failed to logout" } },
      { status: 500, headers: { "X-Request-Id": requestId } },
    );
  }
}


