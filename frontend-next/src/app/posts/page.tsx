import React from "react";

import { headers } from "next/headers";

import PostsPageClient from "../../../components/PostsPageClient";
import {
  DEFAULT_POST_SORT,
  POST_SORT_VALUES,
  type Post as SsrPost,
  type PostSort,
} from "../../lib/schemas";

export const dynamic = "force-dynamic";

function getSsrAppOrigin(): string {
  const configured = process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.origin;
      }
    } catch {
      // Ignore invalid URLs and fall back below
    }
  }
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
  console.debug('[diag][page] PostsPage invoked - searchParams (promise?) ->', !!searchParams);
  const incomingQuery = (searchParams ? await searchParams : {}) as PageSearchParams;
  console.debug('[diag][page] incomingQuery ->', incomingQuery);
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
  console.debug('[diag][page] computed page,pageSize ->', page, pageSize);

  // Auth is now handled client-side with session-based authentication

  // Server-side fetch to pre-render posts for first paint (no spinner)
  // Only fetch SSR data for the first page; other pages will be fetched client-side
  // Avoid noisy console logging in SSR path
  let posts: SsrPost[] | undefined;
  let initialHasNextPage: boolean | undefined;
  try {
    if (page === 1) {
      const url = new URL("/api/posts", getSsrAppOrigin());
      url.searchParams.set("page", String(page));
      // Request one extra to determine if there's a next page without another round trip
      url.searchParams.set("pageSize", String(pageSize + 1));
      url.searchParams.set("sort", sort);
      if (incomingQ !== undefined) {
        url.searchParams.set("q", incomingQ);
      }
      const fetchHeaders: Record<string, string> = {};
      console.debug('[diag][page] calling next/headers()');
      let incomingHeaders;
      try {
        incomingHeaders = await headers();
        console.debug('[diag][page] headers() result ->', incomingHeaders && typeof incomingHeaders.get === 'function' ? '<Headers-like>' : incomingHeaders);
      } catch (e) {
        // headers() can throw when running outside a Next request scope (tests).
        // Don't rethrow here — proceed without incoming headers so SSR can still
        // attempt to fetch (tests can stub global fetch). This mirrors production
        // behavior where cookies may be absent.
        console.debug('[diag][page] headers() threw ->', e);
        incomingHeaders = undefined;
      }
      const cookieHeader = incomingHeaders && typeof incomingHeaders.get === 'function' ? incomingHeaders.get("cookie") : undefined;
      if (cookieHeader) {
        fetchHeaders.cookie = cookieHeader;
      }
      console.debug('[diag][page] globalThis.fetch at call ->', globalThis.fetch);
      try {
        // Compare the free 'fetch' binding to globalThis.fetch
        // to detect if the module is using a different fetch implementation.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.debug('[diag][page] fetch === globalThis.fetch ->', (fetch as any) === (globalThis as any).fetch);
      } catch (e) {
        console.debug('[diag][page] fetch compare threw', e);
      }
      console.debug('[diag][page] typeof fetch at call ->', typeof globalThis.fetch);
      console.debug('[diag][page] globalThis.fetch at call ->', globalThis.fetch);
      try {
        console.debug('[diag][page] fetch.toString ->', String((globalThis.fetch as any).toString?.()));
      } catch (e) {
        console.debug('[diag][page] fetch.toString threw', e);
      }
      const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: fetchHeaders,
      });
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
