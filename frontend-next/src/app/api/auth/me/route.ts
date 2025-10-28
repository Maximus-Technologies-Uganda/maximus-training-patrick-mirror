import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(/;\s*/);
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function decodeSession(token: string): { userId?: string; role?: string } | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const obj = JSON.parse(json) as { userId?: string; role?: string };
    return obj || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies["session"];
  if (!token) return new NextResponse(null, { status: 401 });
  const claims = decodeSession(token);
  if (!claims?.userId) return new NextResponse(null, { status: 401 });
  return NextResponse.json({ userId: claims.userId, role: claims.role ?? "owner" }, { status: 200 });
}

