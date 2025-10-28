import React from "react";

import PostsPageClient from "../../../components/PostsPageClient";
import type { Post as SsrPost } from "../../lib/schemas";

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

type PageSearchParams = { page?: string; pageSize?: string; q?: string };
export default async function PostsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}): Promise<React.ReactElement> {
  const incomingQuery = (searchParams ? await searchParams : {}) as PageSearchParams;
  const page = Number(incomingQuery.page ?? "1");
  const pageSize = Number(incomingQuery.pageSize ?? "10");
  const q = incomingQuery.q ?? "";

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
      const fetchHeaders: Record<string, string> = {};
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
      initialData={posts}
      initialHasNextPage={initialHasNextPage}
    />
  );
}

