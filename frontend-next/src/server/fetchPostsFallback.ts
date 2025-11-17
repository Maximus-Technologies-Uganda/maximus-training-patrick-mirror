import "server-only";

import { headers } from "next/headers";

import type { Post } from "@/lib/schemas";

type PostsPayload =
  | Array<Record<string, unknown>>
  | {
      items?: Array<Record<string, unknown>>;
      hasNextPage?: boolean;
    };

function ensureContent(value: Record<string, unknown>): Post {
  const content =
    typeof value.content === "string"
      ? value.content
      : typeof value.body === "string"
        ? value.body
        : "";
  return { ...(value as Post), content };
}

function normalizePayload(
  payload: unknown,
  pageSize: number
): {
  items?: Post[];
  hasNextPage?: boolean;
} {
  if (Array.isArray(payload)) {
    const normalized = payload.map((item) => ensureContent(item ?? {}));
    return {
      items: normalized.slice(0, pageSize),
      hasNextPage: normalized.length > pageSize,
    };
  }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const objectPayload = payload as {
      items?: Array<Record<string, unknown>>;
      hasNextPage?: boolean;
    };
    if (Array.isArray(objectPayload.items)) {
      const normalized = objectPayload.items.map((item) => ensureContent(item ?? {}));
      return {
        items: normalized.slice(0, pageSize),
        hasNextPage:
          typeof objectPayload.hasNextPage === "boolean"
            ? objectPayload.hasNextPage
            : normalized.length > pageSize,
      };
    }
  }
  return {};
}

export async function fetchLocalPostsFallback(
  params: URLSearchParams,
  pageSize: number
): Promise<{ items?: Post[]; hasNextPage?: boolean } | null> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return null;
  const forwardedProto = headerList.get("x-forwarded-proto");
  const protocol =
    forwardedProto && forwardedProto.trim().length > 0
      ? forwardedProto
      : host.includes("localhost") || host.startsWith("127.")
        ? "http"
        : "https";
  const origin = `${protocol}://${host}`;
  try {
    const cookieHeader = headerList.get("cookie");
    const response = await fetch(`${origin}/api/posts?${params.toString()}`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      cache: "no-store",
    });
    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[posts] Local API fallback returned", response.status);
      }
      return null;
    }
    const payload = (await response.json()) as PostsPayload;
    return normalizePayload(payload, pageSize);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[posts] Local API fallback failed", error);
    }
    return null;
  }
}
