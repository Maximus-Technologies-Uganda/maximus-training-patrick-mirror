"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SWRConfig } from "swr";
import type { Cache, SWRConfiguration } from "swr";
import type { State } from "swr/_internal";

import LiveRegion from "./LiveRegion";
import NewPostForm from "./NewPostForm";
import PageSizeSelect from "./PageSizeSelect";
import { PaginationControls } from "../src/components/PaginationControls";
import PostsList from "./PostsList";
import SearchInput from "./SearchInput";
import { usePostsList } from "../src/lib/swr";
import { useSession } from "../src/lib/auth/use-session";
import {
  DEFAULT_POST_SORT,
  POST_SORT_VALUES,
  type Post,
  type PostList,
  type PostSort,
} from "../src/lib/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SWRCacheValue = State<unknown, any>;

function ErrorState(): React.ReactElement {
  return (
    <div role="alert" className="rounded-md border border-error/40 bg-error/10 p-3 text-error">
      Error loading posts. Please try again.
    </div>
  );
}

// Utility to check if a valid session cookie exists
function useSessionCookieStatus(): boolean {
  const [hasSessionCookie, setHasSessionCookie] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    try {
      const m = document.cookie.match(/(?:^|;\s*)session=([^;]+)/);
      const token = m?.[1];
      if (!token) {
        setHasSessionCookie(false);
        return;
      }
      const parts = token.split(".");
      if (parts.length !== 3) {
        setHasSessionCookie(false);
        return;
      }
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded)) as { userId?: string };
      setHasSessionCookie(typeof payload.userId === "string");
    } catch {
      setHasSessionCookie(false);
    }
  }, []);

  return hasSessionCookie;
}

function EmptyState(): React.ReactElement {
  return (
    <p className="text-text-muted" aria-live="polite">
      No posts yet
    </p>
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
  query: string
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter(
    (p) =>
      p.title.toLowerCase().includes(normalized) || p.content.toLowerCase().includes(normalized)
  );
}

const SORT_OPTIONS = new Set<PostSort>(POST_SORT_VALUES);

const SORT_LABELS: Record<PostSort, string> = {
  "date-desc": "Newest First",
  "date-asc": "Oldest First",
  "title-asc": "Title (A-Z)",
  "title-desc": "Title (Z-A)",
};

function isValidSort(value: string | null): value is PostSort {
  if (!value) return false;
  return SORT_OPTIONS.has(value as PostSort);
}

export default function PostsPageClient({
  page: initialPage = 1,
  pageSize: initialPageSize = 10,
  q: incomingSearchQuery = "",
  sort: initialSort = DEFAULT_POST_SORT,
  initialData,
  initialHasNextPage,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: PostSort;
  initialData?: Post[];
  initialHasNextPage?: boolean;
}): React.ReactElement {
  const { session, signOut } = useSession();
  // useSessionCookieStatus hook is available if needed for future fallback auth
  const _hasSessionCookie = useSessionCookieStatus();
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [searchQuery, setSearchQuery] = useState<string>(incomingSearchQuery);
  const [sort, setSort] = useState<PostSort>(initialSort);

  // Initialize from URL on mount
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const nextPage = Number(url.searchParams.get("page") ?? String(initialPage));
      const nextPageSize = Number(url.searchParams.get("pageSize") ?? String(initialPageSize));
      const nextQ = url.searchParams.get("q") ?? incomingSearchQuery;
      const nextSortParam = url.searchParams.get("sort");
      setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
      setPageSize(Number.isFinite(nextPageSize) && nextPageSize > 0 ? nextPageSize : 10);
      setSearchQuery(nextQ);
      if (isValidSort(nextSortParam)) {
        setSort(nextSortParam);
      } else {
        setSort(initialSort);
      }
    } catch (_error) {
      // Ignore malformed URL values; fall back to defaults.
    }
  }, [initialPage, initialPageSize, incomingSearchQuery, initialSort]);

  // Sync internal state with browser navigation (back/forward)
  useEffect(() => {
    const onPopState = (): void => {
      try {
        const url = new URL(window.location.href);
        const p = Number(url.searchParams.get("page") ?? "1");
        const ps = Number(url.searchParams.get("pageSize") ?? "10");
        const qParam = url.searchParams.get("q") ?? "";
        const sortParam = url.searchParams.get("sort");
        setPage(Number.isFinite(p) && p > 0 ? p : 1);
        setPageSize(Number.isFinite(ps) && ps > 0 ? ps : 10);
        setSearchQuery(qParam);
        if (isValidSort(sortParam)) {
          setSort(sortParam);
        } else {
          setSort(DEFAULT_POST_SORT);
        }
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
    [initialData]
  );
  const initialList: PostList | undefined = useMemo(() => {
    if (!initialData || initialData.length === 0) return undefined;
    return {
      page: initialPage,
      pageSize: initialPageSize,
      hasNextPage: Boolean(initialHasNextPage),
      items: initialItems,
      sort: initialSort,
    };
  }, [initialData, initialItems, initialPage, initialPageSize, initialHasNextPage, initialSort]);

  const shouldUseFallback = useMemo(
    () =>
      Boolean(
        initialList &&
          page === initialPage &&
          pageSize === initialPageSize &&
          sort === initialSort &&
          searchQuery === incomingSearchQuery
      ),
    [
      initialList,
      page,
      pageSize,
      sort,
      searchQuery,
      initialPage,
      initialPageSize,
      initialSort,
      incomingSearchQuery,
    ]
  );

  const { data, isLoading, error } = usePostsList({
    page,
    pageSize,
    q: searchQuery,
    sort,
    fallbackData: shouldUseFallback ? initialList : undefined,
  });

  const effectiveItems: Post[] = useMemo(() => {
    if (data?.items && data.items.length > 0) {
      return data.items;
    }
    if (shouldUseFallback) {
      return initialItems;
    }
    return [];
  }, [data?.items, initialItems, shouldUseFallback]);

  const hasNextPage = Boolean(
    data?.hasNextPage ?? (shouldUseFallback ? initialHasNextPage : false)
  );

  const totalPages = useMemo(() => {
    const total = data?.total;
    if (typeof total === "number" && Number.isFinite(total)) {
      return Math.max(1, Math.ceil(total / pageSize));
    }
    if (hasNextPage) {
      return Math.max(1, page + 1);
    }
    return Math.max(1, page);
  }, [data?.total, hasNextPage, page, pageSize]);

  const statusMessage = useMemo(() => {
    if (isLoading && effectiveItems.length === 0) {
      return "Loading posts…";
    }
    // Announce current page to screen readers when page changes
    if (effectiveItems.length > 0) {
      return `Showing page ${page} of ${totalPages}`;
    }
    return "";
  }, [isLoading, effectiveItems.length, page, totalPages]);

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Focus heading after page change for a11y
    headingRef.current?.focus();
  }, [page, pageSize, sort]);

  const updateUrlQuery = (next: {
    page?: number;
    pageSize?: number;
    q?: string;
    sort?: PostSort;
  }): void => {
    const url = new URL(window.location.href);
    const newPage = next.page ?? page;
    const newPageSize = next.pageSize ?? pageSize;
    const newQ = next.q ?? searchQuery;
    const newSort = next.sort ?? sort;
    url.searchParams.set("page", String(newPage));
    url.searchParams.set("pageSize", String(newPageSize));
    url.searchParams.set("sort", newSort);
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
  const onChangeSort = (nextSort: PostSort): void => {
    setSort(nextSort);
    setPage(1);
    updateUrlQuery({ sort: nextSort, page: 1 });
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
    []
  );

  const mainContent = (
    <main className="mx-auto max-w-3xl bg-surface p-4 text-text">
      <LiveRegion message={statusMessage} />

      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-text">
        Posts
      </h1>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageSizeSelect pageSize={pageSize} onChangeAction={onChangePageSize} />
        <label className="text-sm text-text">
          Sort by
          <select
            value={sort}
            onChange={(event) => {
              const value = event.target.value;
              if (isValidSort(value)) {
                onChangeSort(value);
              }
            }}
            className="ml-2 rounded border border-text-muted/40 px-2 py-1 text-sm text-text"
            aria-label="Sort posts"
          >
            {POST_SORT_VALUES.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
        <SearchInput value={searchQuery} onChangeAction={onChangeSearchQuery} />
      </div>

      <div
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        aria-live="polite"
      >
        {session ? (
          <p className="text-sm text-text">
            Signed in as <span className="font-semibold">{session.name ?? session.userId}</span>
          </p>
        ) : (
          <p className="text-sm text-text-muted">
            You are browsing as a guest. Sign in to manage your posts.
          </p>
        )}
        {session ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-text-muted/40 px-3 py-1 text-sm font-medium text-text transition hover:bg-primary/10"
            onClick={signOut}
          >
            Sign out
          </button>
        ) : (
          <a
            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-surface transition hover:bg-primary/90"
            href="/login"
          >
            Sign in
          </a>
        )}
      </div>

      <div className="mt-4">
        <NewPostForm
          pageSize={pageSize}
          sort={sort}
          query={searchQuery}
          onSuccessAction={onCreateSuccess}
        />
      </div>

      <section className="mt-4" aria-label="Posts list">
        {error && effectiveItems.length === 0 ? (
          <ErrorState />
        ) : isLoading && effectiveItems.length === 0 ? (
          <p className="text-text-muted">Loading…</p>
        ) : (
          (() => {
            const items = filterPostsByQuery(effectiveItems, searchQuery);
            return items.length === 0 ? (
              <EmptyState />
            ) : (
              <PostsList
                items={items}
                currentUserId={session?.userId ?? null}
                currentUserRole={session?.role}
              />
            );
          })()
        )}
      </section>

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPrevious={() => {
          if (page > 1) {
            onChangePage(page - 1);
          }
        }}
        onNext={() => {
          if (page < totalPages) {
            onChangePage(page + 1);
          }
        }}
      />
    </main>
  );

  // Using createElement to avoid passing children as a prop (react/no-children-prop)
  // eslint-disable-next-line react/no-children-prop
  return React.createElement(
    SWRConfig as React.ComponentType<{ value: typeof swrValue; children: React.ReactNode }>,
    {
      value: swrValue,
      children: mainContent,
    }
  );
}
