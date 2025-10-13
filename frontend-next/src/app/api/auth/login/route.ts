import { NextRequest, NextResponse } from "next/server";

// Keep server-only API base URL; fallback to public var for local dev parity
const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = new URL("/auth/login", API_BASE_URL).toString();
  let bodyText = "";
  try {
    bodyText = await request.text();
  } catch {
    bodyText = "{}";
  }
  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Forward raw body text to preserve exact payload
      body: bodyText,
    });

    // Propagate Set-Cookie from upstream so the cookie is scoped to this app's host
    const setCookie = upstreamResponse.headers.get("set-cookie");
    if (setCookie) {
      const res = new NextResponse(null, { status: upstreamResponse.status });
      res.headers.set("set-cookie", setCookie);
      return res;
    }
    return new NextResponse(null, { status: upstreamResponse.status });
  } catch (error) {
    console.error("POST /api/auth/login upstream error", { upstreamUrl, error });
    return NextResponse.json(
      { error: { code: "UPSTREAM_LOGIN_FAILED", message: "Failed to authenticate" } },
      { status: 500 },
    );
  }
}


