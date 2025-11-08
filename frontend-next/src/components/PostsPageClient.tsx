"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SWRConfig, type Cache } from "swr";

import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { PaginationControls } from "./PaginationControls";
import { Card } from "./Card";
import NewPostForm from "./NewPostForm";
import {
  DEFAULT_POST_SORT,
  POST_SORT_VALUES,
  type Post,
  type PostList,
  type PostSort,
} from "../lib/schemas";
import { usePostsList } from "../lib/swr";
import { useSession } from "../lib/auth/use-session";

const SORT_OPTIONS = new Set<PostSort>(POST_SORT_VALUES);

const SORT_LABELS: Record<PostSort, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "title-asc": "Title (A-Z)",
  "title-desc": "Title (Z-A)",
};

function isValidSort(value: string | null | undefined): value is PostSort {
  if (!value) return false;
  return SORT_OPTIONS.has(value as PostSort);
}

type PostsPageClientProps = {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: PostSort;
  initialData?: Post[];
  initialHasNextPage?: boolean;
};

function createSWRCache(): Cache<unknown> {
  return new Map<string, unknown>() as Cache<unknown>;
}

function buildFallbackList(
  initialData: Post[] | undefined,
  page: number,
  pageSize: number,
  hasNextPage: boolean,
  sort: PostSort
): PostList | undefined {
  if (!initialData) return undefined;
  return {
    items: initialData,
    page,
    pageSize,
    hasNextPage,
    sort,
  };
}

/**
 * Derives the total number of pages available from the latest list response.
 *
 * The backend prefers sending an explicit `total`, but when pagination is
 * cursor-based we fall back to inferring the minimum possible page count using
 * the current position. This keeps the UI responsive without over-promising
 * pages that may not exist yet.
 */
function deriveTotalPages(list: PostList | undefined, page: number, pageSize: number): number {
  if (!list) return Math.max(1, page);
  if (typeof list.total === "number" && Number.isFinite(list.total)) {
    return Math.max(1, Math.ceil(list.total / pageSize));
  }
  if (list.hasNextPage) {
    return page + 1;
  }
  return Math.max(1, page);
}

function safeNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const next = Number(value);
  if (Number.isFinite(next) && next > 0) return next;
  return fallback;
}

function PostsPageClientInner({
  page: initialPage = 1,
  pageSize: initialPageSize = 10,
  q: initialQuery = "",
  sort: initialSort = DEFAULT_POST_SORT,
  initialData,
  initialHasNextPage = false,
}: PostsPageClientProps): React.ReactElement {
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [sort, setSort] = useState<PostSort>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");

  const initialParamsRef = useRef({
    page: initialPage,
    pageSize: initialPageSize,
    query: initialQuery,
    sort: initialSort,
  });

  useEffect(() => {
    initialParamsRef.current = {
      page: initialPage,
      pageSize: initialPageSize,
      query: initialQuery,
      sort: initialSort,
    };
  }, [initialPage, initialPageSize, initialQuery, initialSort]);

  const fallbackList = useMemo(
    () =>
      buildFallbackList(
        initialData,
        initialPage,
        initialPageSize,
        Boolean(initialHasNextPage),
        initialSort
      ),
    [initialData, initialPage, initialPageSize, initialHasNextPage, initialSort]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const {
      page: defaultPage,
      pageSize: defaultPageSize,
      query: defaultQuery,
      sort: defaultSort,
    } = initialParamsRef.current;
    const url = new URL(window.location.href);
    const nextPage = safeNumber(url.searchParams.get("page"), defaultPage);
    const nextPageSize = safeNumber(url.searchParams.get("pageSize"), defaultPageSize);
    const nextQuery = url.searchParams.get("q") ?? defaultQuery;
    const sortParam = url.searchParams.get("sort");

    setPage(nextPage);
    setPageSize(nextPageSize);
    setSearchQuery(nextQuery);
    if (isValidSort(sortParam)) {
      setSort(sortParam);
    } else {
      setSort(defaultSort);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = (): void => {
      const url = new URL(window.location.href);
      const nextPage = safeNumber(url.searchParams.get("page"), 1);
      const nextPageSize = safeNumber(
        url.searchParams.get("pageSize"),
        initialParamsRef.current.pageSize
      );
      const nextQuery = url.searchParams.get("q") ?? "";
      const nextSortParam = url.searchParams.get("sort");

      setPage(nextPage);
      setPageSize(nextPageSize);
      setSearchQuery(nextQuery);
      if (isValidSort(nextSortParam)) {
        setSort(nextSortParam);
      } else {
        setSort(DEFAULT_POST_SORT);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const shouldUseInitialFallback =
    page === initialPage &&
    pageSize === initialPageSize &&
    searchQuery === initialQuery &&
    sort === initialSort;

  const initialFallbackData = shouldUseInitialFallback ? fallbackList : undefined;

  const { data, isLoading, isValidating, error, mutate } = usePostsList({
    page,
    pageSize,
    sort,
    q: searchQuery,
    fallbackData: initialFallbackData,
  });

  const resolvedList = data ?? initialFallbackData;
  const posts = resolvedList?.items ?? [];
  const hasNextPage = resolvedList?.hasNextPage ?? false;
  const totalPages = deriveTotalPages(resolvedList, page, pageSize);
  const { session, signOut } = useSession();

  const syncUrl = useCallback(
    (next: { page?: number; sort?: PostSort; q?: string; pageSize?: number }) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      const targetPage = next.page ?? page;
      const targetPageSize = next.pageSize ?? pageSize;
      const targetSort = next.sort ?? sort;
      const targetQuery = next.q ?? searchQuery;

      url.searchParams.set("page", String(targetPage));
      url.searchParams.set("pageSize", String(targetPageSize));
      url.searchParams.set("sort", targetSort);
      if (targetQuery) {
        url.searchParams.set("q", targetQuery);
      } else {
        url.searchParams.delete("q");
      }

      window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
    },
    [page, pageSize, sort, searchQuery]
  );

  const handleNext = (): void => {
    if (!hasNextPage) return;
    const nextPage = page + 1;
    setPage(nextPage);
    syncUrl({ page: nextPage });
  };

  const handlePrevious = (): void => {
    if (page <= 1) return;
    const nextPage = page - 1;
    setPage(nextPage);
    syncUrl({ page: nextPage });
  };

  const handleSortChange = (nextSort: PostSort): void => {
    setSort(nextSort);
    setPage(1);
    syncUrl({ sort: nextSort, page: 1 });
  };

  // Split live announcements into error and non-error so urgent failures are
  // surfaced immediately without delaying polite status updates.
  const [errorAnnouncement, setErrorAnnouncement] = useState<string | null>(null);
  useEffect(() => {
    const hasPosts = posts.length > 0;
    if ((isLoading || isValidating) && !hasPosts) {
      setLiveAnnouncement("Loading posts…");
      setErrorAnnouncement(null);
      return;
    }
    if (error) {
      const message = error instanceof Error ? error.message : undefined;
      setErrorAnnouncement(message ? `Error loading posts: ${message}` : "Error loading posts");
      setLiveAnnouncement("");
      return;
    }
    if (isValidating && hasPosts) {
      setLiveAnnouncement("Refreshing posts…");
      setErrorAnnouncement(null);
      return;
    }
    if (!hasPosts) {
      setLiveAnnouncement("No posts available");
      setErrorAnnouncement(null);
      return;
    }
    const sortLabel = SORT_LABELS[sort];
    const announcement = `Showing page ${page} of ${totalPages}, ${posts.length} posts, sorted by ${sortLabel}`;
    setLiveAnnouncement(announcement);
    setErrorAnnouncement(null);
  }, [isLoading, isValidating, error, posts.length, page, totalPages, sort]);

  const errorMessage = error instanceof Error ? error.message : undefined;

  const handleRetry = useCallback(() => {
    setErrorAnnouncement(null);
    setLiveAnnouncement("Loading posts…");
    void mutate();
  }, [mutate]);

  const handleCreateSuccess = useCallback(() => {
    if (page !== 1) {
      setPage(1);
      syncUrl({ page: 1 });
    }
  }, [page, syncUrl]);

  return (
    <section aria-label="Posts list" className="flex flex-col gap-6">
      {/* Polite live region for non-error announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {errorAnnouncement ? "" : liveAnnouncement}
      </div>
      {/* Assertive live region for error announcements */}
      <div role="status" aria-live="assertive" className="sr-only">
        {errorAnnouncement}
      </div>
      {/* Auth banner */}
      <div className="flex flex-col gap-3 items-start justify-between rounded-md border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
        <div>
          {session ? (
            <p className="text-sm text-text-muted">
              Signed in as <span className="font-semibold">{session.name ?? session.userId}</span>
            </p>
          ) : (
            <p className="text-sm text-text-muted">
              You are browsing as a guest.{" "}
              {/* @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2025-06-06) */}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>{" "}
              to publish posts.
            </p>
          )}
        </div>
        {session ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-text-muted/40 px-3 py-1 text-sm font-medium text-text transition hover:bg-primary/10 whitespace-nowrap"
            onClick={signOut}
          >
            Sign out
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text">Posts</h1>
        <label className="text-sm text-text">
          Sort by
          <select
            value={sort}
            onChange={(event) => {
              const value = event.target.value;
              if (isValidSort(value)) {
                handleSortChange(value);
              }
            }}
            aria-label="Sort posts"
            className="ml-2 rounded border border-text-muted/40 px-2 py-1 text-sm text-text"
          >
            {POST_SORT_VALUES.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Card
        header={
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-text">Create a new post</h2>
            <p className="text-sm text-text-muted">
              {session
                ? `Signed in as ${session.name ?? session.userId}`
                : "You are browsing as a guest. Sign in to publish posts."}
            </p>
          </div>
        }
      >
        <NewPostForm
          pageSize={pageSize}
          sort={sort}
          query={searchQuery}
          onSuccess={handleCreateSuccess}
        />
      </Card>

      {posts.length === 0 && (isLoading || isValidating) ? (
        <LoadingState message="Loading posts…" />
      ) : error && posts.length === 0 ? (
        <ErrorState title="Error loading posts" message={errorMessage} onRetry={handleRetry} />
      ) : posts.length === 0 ? (
        <EmptyState title="No posts yet" message="There are currently no posts." />
      ) : (
        <ul role="list" className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Card>
                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-semibold text-text">{post.title}</h2>
                  <p className="text-sm text-text-muted">{post.content}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </section>
  );
}

export default function PostsPageClient(props: PostsPageClientProps): React.ReactElement {
  const cacheRef = useRef<Cache<unknown> | null>(null);

  // Scope a dedicated SWR cache to each PostsPageClient instance so multiple
  // lists rendered on the same page do not mutate one another's pagination
  // state. This mirrors the SSR fallback isolation described in the spec.
  const swrValue = useMemo(
    () => ({
      provider: (): Cache<unknown> => {
        if (!cacheRef.current) {
          cacheRef.current = createSWRCache();
        }
        return cacheRef.current;
      },
    }),
    []
  );

  return (
    // @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2025-06-06)
    <SWRConfig value={swrValue}>
      <PostsPageClientInner {...props} />
    </SWRConfig>
  );
}
