import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL: string =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const runtime = "nodejs";

export async function POST(_request: NextRequest): Promise<NextResponse> {
  const upstreamUrl = new URL("/auth/logout", API_BASE_URL).toString();
  try {
    const upstreamResponse = await fetch(upstreamUrl, { method: "POST" });
    // Forward cookie clearing header
    const setCookie = upstreamResponse.headers.get("set-cookie");
    if (setCookie) {
      const res = new NextResponse(null, { status: upstreamResponse.status });
      res.headers.set("set-cookie", setCookie);
      return res;
    }
    return new NextResponse(null, { status: upstreamResponse.status });
  } catch (error) {
    console.error("POST /api/auth/logout upstream error", { upstreamUrl, error });
    return NextResponse.json(
      { error: { code: "UPSTREAM_LOGOUT_FAILED", message: "Failed to logout" } },
      { status: 500 },
    );
  }
}


