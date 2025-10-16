import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getIdToken } from "../../../../server/auth/getIdToken";

const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const IAP_AUDIENCE: string | undefined = process.env.IAP_AUDIENCE || process.env.ID_TOKEN_AUDIENCE;

export const runtime = "nodejs";

async function authHeader(): Promise<Record<string, string>> {
  if (!IAP_AUDIENCE) return {};
  const token = await getIdToken(IAP_AUDIENCE);
  return { Authorization: `Bearer ${token}` };
}

export async function DELETE(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1] || segments[segments.length - 2];
  const upstreamUrl = new URL(`/posts/${encodeURIComponent(id)}`, API_BASE_URL).toString();
  const incomingCookieHeader = request.headers.get("cookie") || "";
  const requestId = randomUUID();
  const upstream = await fetch(upstreamUrl, {
    method: "DELETE",
    headers: { ...(await authHeader()), ...(incomingCookieHeader ? { Cookie: incomingCookieHeader } : {}), "X-Request-Id": requestId },
  });
  const upstreamRequestId = upstream.headers.get("x-request-id") || requestId;
  return new NextResponse(null, { status: upstream.status, headers: { "X-Request-Id": upstreamRequestId } });
}

export async function PATCH(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const id = segments[segments.length - 1] || segments[segments.length - 2];
  const upstreamUrl = new URL(`/posts/${encodeURIComponent(id)}`, API_BASE_URL).toString();
  const body = await request.text();
  const incomingCookieHeader = request.headers.get("cookie") || "";
  const requestId = randomUUID();
  const upstream = await fetch(upstreamUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
      ...(incomingCookieHeader ? { Cookie: incomingCookieHeader } : {}),
      "X-Request-Id": requestId,
    },
    body,
  });
  const upstreamBody = await upstream.text();
  const contentType = upstream.headers.get("content-type") || "";
  const upstreamRequestId = upstream.headers.get("x-request-id") || requestId;
  if (contentType.includes("application/json")) {
    try {
      return NextResponse.json(JSON.parse(upstreamBody), { status: upstream.status, headers: { "X-Request-Id": upstreamRequestId } });
    } catch {
      // fall through
    }
  }
  return new NextResponse(upstreamBody, { status: upstream.status, headers: { "content-type": contentType || "text/plain", "X-Request-Id": upstreamRequestId } });
}


