"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SWRConfig } from "swr";
import type { Cache, SWRConfiguration } from "swr";
import type { State } from "swr/_internal";

import LiveRegion from "./LiveRegion";
import NewPostForm from "./NewPostForm";
import PageSizeSelect from "./PageSizeSelect";
import PaginationControls from "./PaginationControls";
import PostsList from "./PostsList";
import SearchInput from "./SearchInput";
import { usePostsList } from "../src/lib/swr";
import { useSession } from "../src/lib/auth/use-session";
import type { Post, PostList } from "../src/lib/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SWRCacheValue = State<unknown, any>;

function ErrorState(): React.ReactElement {
  return (
    <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">
      Error loading posts. Please try again.
    </div>
  );
}

// Utility to check if a valid session cookie exists
function useSessionCookieStatus(): boolean {
  const [hasSessionCookie, setHasSessionCookie] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    try {
      const m = document.cookie.match(/(?:^|;\s*)session=([^;]+)/);
      const token = m?.[1];
      if (!token) {
        setHasSessionCookie(false);
        return;
      }
      const parts = token.split('.');
      if (parts.length !== 3) {
        setHasSessionCookie(false);
        return;
      }
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded)) as { userId?: string };
      setHasSessionCookie(typeof payload.userId === 'string');
    } catch {
      setHasSessionCookie(false);
    }
  }, []);

  return hasSessionCookie;
}

function EmptyState(): React.ReactElement {
  return (
    <p className="text-gray-600" aria-live="polite">No posts yet</p>
  );
}

function createSWRCache(): Cache<unknown> {
  const map = new Map<string, SWRCacheValue>();
  return {
    get(key: string) {
      return map.get(key);
    },
    set(key: string, value: SWRCacheValue) {
      map.set(key, value);
    },
    delete(key: string) {
      map.delete(key);
    },
    keys() {
      return map.keys();
    },
  };
}

function filterPostsByQuery<T extends { title: string; content: string }>(
  items: T[],
  query: string,
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter(
    (p) => p.title.toLowerCase().includes(normalized) || p.content.toLowerCase().includes(normalized),
  );
}

export default function PostsPageClient({
  page: initialPage = 1,
  pageSize: initialPageSize = 10,
  q: incomingSearchQuery = "",
  initialData,
  initialHasNextPage,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  initialData?: Post[];
  initialHasNextPage?: boolean;
}): React.ReactElement {
  const { session, signOut } = useSession();
  // useSessionCookieStatus hook is available if needed for future fallback auth
  const _hasSessionCookie = useSessionCookieStatus();
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [searchQuery, setSearchQuery] = useState<string>(incomingSearchQuery);

  // Initialize from URL on mount
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const nextPage = Number(url.searchParams.get("page") ?? String(initialPage));
      const nextPageSize = Number(
        url.searchParams.get("pageSize") ?? String(initialPageSize),
      );
      const nextQ = url.searchParams.get("q") ?? incomingSearchQuery;
      setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
      setPageSize(
        Number.isFinite(nextPageSize) && nextPageSize > 0 ? nextPageSize : 10,
      );
      setSearchQuery(nextQ);
    } catch (_error) {
      // Ignore malformed URL values; fall back to defaults.
    }
  }, [initialPage, initialPageSize, incomingSearchQuery]);

  // Sync internal state with browser navigation (back/forward)
  useEffect(() => {
    const onPopState = (): void => {
      try {
        const url = new URL(window.location.href);
        const p = Number(url.searchParams.get("page") ?? "1");
        const ps = Number(url.searchParams.get("pageSize") ?? "10");
        const qParam = url.searchParams.get("q") ?? "";
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 10);
        setSearchQuery(qParam);
      } catch (_error) {
        // Ignore malformed URL values during history navigation.
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const initialItems: Post[] = useMemo(
    () =>
      (initialData ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        published: p.published,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        ownerId: p.ownerId,
        tags: p.tags,
      })),
    [initialData],
  );
  const initialList: PostList | undefined = useMemo(() => {
    if (!initialData || initialData.length === 0) return undefined;
    return { page: initialPage, pageSize: initialPageSize, hasNextPage: Boolean(initialHasNextPage), items: initialItems };
  }, [initialData, initialItems, initialPage, initialPageSize, initialHasNextPage]);

  const shouldUseFallback = useMemo(
    () => Boolean(initialList && page === initialPage && pageSize === initialPageSize),
    [initialList, page, pageSize, initialPage, initialPageSize],
  );

  const { data, isLoading, error } = usePostsList({
    page,
    pageSize,
    fallbackData: shouldUseFallback ? initialList : undefined,
  });

  const effectiveItems: Post[] = data?.items ?? (shouldUseFallback ? initialItems : []);

  const statusMessage = useMemo(() => (isLoading && effectiveItems.length === 0 ? "Loading posts…" : ""), [isLoading, effectiveItems.length]);

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Focus heading after page change for a11y
    headingRef.current?.focus();
  }, [page, pageSize]);

  const updateUrlQuery = (next: { page?: number; pageSize?: number; q?: string }): void => {
    const url = new URL(window.location.href);
    const newPage = next.page ?? page;
    const newPageSize = next.pageSize ?? pageSize;
    const newQ = next.q ?? searchQuery;
    url.searchParams.set("page", String(newPage));
    url.searchParams.set("pageSize", String(newPageSize));
    if (newQ) url.searchParams.set("q", newQ);
    else url.searchParams.delete("q");
    window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
  };

  const onChangePage = (nextPage: number): void => {
    setPage(nextPage);
    updateUrlQuery({ page: nextPage });
  };
  const onChangePageSize = (nextSize: number): void => {
    setPage(1);
    setPageSize(nextSize);
    updateUrlQuery({ page: 1, pageSize: nextSize });
  };
  const onChangeSearchQuery = (nextQ: string): void => {
    setSearchQuery(nextQ);
    updateUrlQuery({ q: nextQ });
  };

  const onCreateSuccess = (): void => {
    // Reset to first page so the new post is visible and URL stays in sync
    if (page !== 1) {
      setPage(1);
      updateUrlQuery({ page: 1 });
    }
  };

  // removed unused filteredItems; filtering applied at render using effectiveItems

  // Keep SWR cache stable across renders for this page instance (keys must be strings per SWR types)
  const cacheRef = useRef<Cache<unknown> | null>(null);
  if (!cacheRef.current) cacheRef.current = createSWRCache();
  const swrValue = useMemo<SWRConfiguration>(
    () => ({
      provider: () => cacheRef.current as Cache<unknown>,
    }),
    [],
  );


  return (
    <SWRConfig value={swrValue}>
      <main className="mx-auto max-w-3xl p-4">
        <LiveRegion message={statusMessage} />

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-gray-900"
        >
          Posts
        </h1>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <PageSizeSelect pageSize={pageSize} onChange={onChangePageSize} />
          <SearchInput value={searchQuery} onChange={onChangeSearchQuery} />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
          {session ? (
            <p className="text-sm text-gray-700">
              Signed in as <span className="font-semibold">{session.name ?? session.userId}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">You are browsing as a guest. Sign in to manage your posts.</p>
          )}
          {session ? (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              onClick={signOut}
            >
              Sign out
            </button>
          ) : (
            <Link
              className="inline-flex items-center justify-center rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-indigo-700"
              href="/login"
            >
              Sign in
            </Link>
          )}
        </div>

        <div className="mt-6">
          <NewPostForm pageSize={pageSize} onSuccess={onCreateSuccess} />
        </div>

        <section className="mt-6" aria-label="Posts list">
          {error && effectiveItems.length === 0 ? (
            <ErrorState />
          ) : isLoading && effectiveItems.length === 0 ? (
            <p className="text-gray-600">Loading…</p>
          ) : (() => {
            const items = filterPostsByQuery(effectiveItems, searchQuery);
            return items.length === 0 ? (
              <EmptyState />
            ) : (
              <PostsList items={items} currentUserId={session?.userId ?? null} currentUserRole={session?.role} />
            );
          })()}
        </section>

        <PaginationControls
          page={page}
          hasNextPage={Boolean(data?.hasNextPage ?? (shouldUseFallback ? initialHasNextPage : false))}
          onChangePage={onChangePage}
        />
      </main>
    </SWRConfig>
  );
}
