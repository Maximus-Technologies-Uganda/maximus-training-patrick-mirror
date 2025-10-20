import React from "react";
import { cookies, headers } from "next/headers";

import PostsPageClient from "../../../components/PostsPageClient";
import type { Post as SsrPost } from "../../lib/schemas";

export const dynamic = "force-dynamic";

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

  // Read session cookie on the server to derive userId without exposing the cookie to the client
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value || "";
  const userId = (() => {
    try {
      const parts = session.split(".");
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
      return typeof payload.userId === "string" ? payload.userId : null;
    } catch {
      return null;
    }
  })();

  // Server-side fetch to pre-render posts for first paint (no spinner)
  // Only fetch SSR data for the first page; other pages will be fetched client-side
  console.log(`[SSR] Fetching posts for initial render at ${new Date().toISOString()}`);
  let posts: SsrPost[] | undefined;
  let initialHasNextPage: boolean | undefined;
  try {
    if (page === 1) {
      const headerStore = await headers();
      const protocol = headerStore.get("x-forwarded-proto") ?? "http";
      const host =
        headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? undefined;
      const fallbackOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const origin = host ? `${protocol}://${host}` : fallbackOrigin;
      const url = new URL("/api/posts", origin);
      url.searchParams.set("page", String(page));
      // Request one extra to determine if there's a next page without another round trip
      url.searchParams.set("pageSize", String(pageSize + 1));
      const fetchHeaders: Record<string, string> = {};
      if (session) {
        fetchHeaders.Cookie = `session=${session}`;
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
      currentUserId={userId ?? undefined}
      initialData={posts}
      initialHasNextPage={initialHasNextPage}
    />
  );
}


