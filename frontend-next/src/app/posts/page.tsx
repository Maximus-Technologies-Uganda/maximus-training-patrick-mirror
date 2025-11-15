import React from "react";

import { headers } from "next/headers";

import PostsPageClient from "@/components/PostsPageClient";
import {
  DEFAULT_POST_SORT,
  POST_SORT_VALUES,
  type Post as SsrPost,
  type PostSort,
} from "../../lib/schemas";

export const dynamic = "force-dynamic";

type HeaderLike = {
  get(name: string): string | null | undefined;
};

function parseOrigin(candidate: string | undefined | null): string | null {
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {
    // Ignore invalid URLs and fall back to other strategies
  }
  return null;
}

function inferOriginFromHeaders(incoming: HeaderLike | undefined): string | null {
  if (!incoming) return null;
  const forwardedHost = incoming.get("x-forwarded-host") || incoming.get("host");
  if (!forwardedHost) return null;
  const protoHeader = incoming.get("x-forwarded-proto") || "https";
  const proto = protoHeader
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);
  const scheme = proto === "http" || proto === "https" ? proto : "https";
  return `${scheme}://${forwardedHost}`;
}

function getSsrAppOrigin(incoming: HeaderLike | undefined): string {
  const fromEnv = parseOrigin(process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv;
  const fromHeaders = parseOrigin(inferOriginFromHeaders(incoming));
  if (fromHeaders) return fromHeaders;
  return "http://localhost:3000";
}

const SORT_OPTIONS_SET = new Set<PostSort>(POST_SORT_VALUES);

type PageSearchParams = { page?: string; pageSize?: string; q?: string; sort?: string };

function parseSort(value: string | undefined): PostSort {
  if (value && SORT_OPTIONS_SET.has(value as PostSort)) {
    return value as PostSort;
  }
  return DEFAULT_POST_SORT;
}
export default async function PostsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}): Promise<React.ReactElement> {
  let incomingHeaders: HeaderLike | undefined;
  try {
    incomingHeaders = await headers();
  } catch (_e) {
    incomingHeaders = undefined;
  }
  const incomingQuery = (searchParams ? await searchParams : {}) as PageSearchParams;
  const requestedPage = Number(incomingQuery.page ?? "1");
  const requestedPageSize = Number(incomingQuery.pageSize ?? "10");
  const incomingQ = typeof incomingQuery.q === "string" ? incomingQuery.q : undefined;
  const q = incomingQ ?? "";
  const sort = parseSort(incomingQuery.sort);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize =
    Number.isFinite(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, 100)
      : 10;

  // Auth is now handled client-side with session-based authentication

  // Server-side fetch to pre-render posts for first paint (no spinner)
  // Fetch SSR data for all pages to ensure fast first paint (spec FR-001)
  // Avoid noisy console logging in SSR path
  let posts: SsrPost[] | undefined;
  let initialHasNextPage: boolean | undefined;
  try {
    // SSR for all pages to meet spec requirement FR-001 (SSR-first architecture)
    const url = new URL("/api/posts", getSsrAppOrigin(incomingHeaders));
    url.searchParams.set("page", String(page));
    // Request one extra to determine if there's a next page without another round trip
    url.searchParams.set("pageSize", String(pageSize + 1));
    url.searchParams.set("sort", sort);
    if (incomingQ !== undefined) {
      url.searchParams.set("q", incomingQ);
    }
    const fetchHeaders: Record<string, string> = {};
    const cookieHeader =
      incomingHeaders && typeof incomingHeaders.get === "function"
        ? incomingHeaders.get("cookie")
        : undefined;
    if (cookieHeader) {
      fetchHeaders.cookie = cookieHeader;
    }
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: fetchHeaders,
    });
    const fallbackSource = res.headers.get("x-posts-fallback-source");
    const fallbackCountHeader = res.headers.get("x-posts-fallback-count");
    const shouldDropLocalEmptyFallback = fallbackSource === "local" && fallbackCountHeader === "0";
    if (res.ok) {
      const data = (await res.json()) as unknown;
      if (Array.isArray(data)) {
        const arr = (data as Array<Record<string, unknown>>).map((p) => ({
          ...(p as Record<string, unknown>),
          // Ensure content exists; some upstreams use `body`
          content:
            typeof (p as { content?: unknown }).content === "string"
              ? (p as { content: string }).content
              : typeof (p as { body?: unknown }).body === "string"
                ? (p as { body: string }).body
                : "",
        })) as unknown as SsrPost[];
        initialHasNextPage = arr.length > pageSize;
        posts = arr.slice(0, pageSize);
      } else if (data && typeof data === "object") {
        const obj = data as { items?: SsrPost[]; hasNextPage?: boolean };
        if (Array.isArray(obj.items)) {
          const normalized = (obj.items as Array<Record<string, unknown>>).map((p) => ({
            ...(p as Record<string, unknown>),
            content:
              typeof (p as { content?: unknown }).content === "string"
                ? (p as { content: string }).content
                : typeof (p as { body?: unknown }).body === "string"
                  ? (p as { body: string }).body
                  : "",
          })) as unknown as SsrPost[];
          posts = normalized.slice(0, pageSize);
          initialHasNextPage =
            typeof obj.hasNextPage === "boolean" ? obj.hasNextPage : obj.items.length > pageSize;
        }
      }
      if (shouldDropLocalEmptyFallback) {
        posts = undefined;
        initialHasNextPage = undefined;
      }
    }
  } catch {
    // ignore upstream errors; render without initial data
  }
  return (
    <PostsPageClient
      page={page}
      pageSize={pageSize}
      q={q}
      sort={sort}
      initialData={posts}
      initialHasNextPage={initialHasNextPage}
    />
  );
}
