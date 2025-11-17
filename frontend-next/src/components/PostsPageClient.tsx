"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SWRConfig, type Cache } from "swr";

import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { PaginationControls } from "./PaginationControls";
import { Card } from "./Card";
import NewPostForm from "./NewPostForm";
import PostsList from "../../components/PostsList";
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
  initialDataSource?: "upstream" | "local-fallback";
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
  initialDataSource = "upstream",
}: PostsPageClientProps): React.ReactElement {
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [sort, setSort] = useState<PostSort>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

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

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const shouldUseInitialFallback =
    page === initialPage &&
    pageSize === initialPageSize &&
    searchQuery === initialQuery &&
    sort === initialSort;

  const initialFallbackData = shouldUseInitialFallback ? fallbackList : undefined;
  const shouldForceRevalidation = initialDataSource === "local-fallback";

  const { data, isLoading, isValidating, error, mutate } = usePostsList({
    page,
    pageSize,
    sort,
    q: searchQuery,
    fallbackData: initialFallbackData,
    revalidateOnMount: shouldForceRevalidation ? true : undefined,
  });

  const resolvedList = data ?? initialFallbackData;
  const posts = resolvedList?.items ?? [];
  const hasNextPage = resolvedList?.hasNextPage ?? false;
  const totalPages = deriveTotalPages(resolvedList, page, pageSize);
  const { session, signOut } = useSession();
  const hasInitialFallback = Boolean(initialFallbackData);
  const usingFallbackReference = hasInitialFallback && data === initialFallbackData;
  const treatFallbackAsAuthoritative = initialDataSource !== "local-fallback";
  const hasAuthoritativeData = data
    ? !usingFallbackReference || treatFallbackAsAuthoritative
    : treatFallbackAsAuthoritative && hasInitialFallback;
  const canRenderFallbackWhileValidating = hasInitialFallback && !hasAuthoritativeData;
  const awaitingAuthoritativeData = !hasAuthoritativeData && (isLoading || isValidating);
  const showLoadingState =
    awaitingAuthoritativeData && (!canRenderFallbackWhileValidating || hasHydrated);
  const showErrorState = Boolean(error) && !hasAuthoritativeData && !isValidating;
  const showEmptyState =
    !showLoadingState && !showErrorState && hasAuthoritativeData && posts.length === 0;

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
    if (showLoadingState) {
      setLiveAnnouncement("Loading posts…");
      setErrorAnnouncement(null);
      return;
    }
    if (showErrorState) {
      const message = error instanceof Error ? error.message : undefined;
      setErrorAnnouncement(message ? `Error loading posts: ${message}` : "Error loading posts");
      setLiveAnnouncement("");
      return;
    }
    if (canRenderFallbackWhileValidating) {
      setLiveAnnouncement("Showing cached posts while we fetch the latest data.");
      setErrorAnnouncement(null);
      return;
    }
    if (showEmptyState) {
      setLiveAnnouncement("No posts available");
      setErrorAnnouncement(null);
      return;
    }
    if (hasAuthoritativeData && posts.length > 0) {
      const sortLabel = SORT_LABELS[sort];
      const announcement = `Showing page ${page} of ${totalPages}, ${posts.length} posts, sorted by ${sortLabel}`;
      setLiveAnnouncement(announcement);
      setErrorAnnouncement(null);
      return;
    }
    if (!hasAuthoritativeData && hasInitialFallback) {
      setLiveAnnouncement("Loading posts…");
      setErrorAnnouncement(null);
    }
  }, [
    showLoadingState,
    showErrorState,
    showEmptyState,
    hasAuthoritativeData,
    posts.length,
    sort,
    page,
    totalPages,
    error,
    hasInitialFallback,
    canRenderFallbackWhileValidating,
  ]);

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
    <section aria-label="Posts list" className="flex flex-col gap-4">
      {/* Polite live region for non-error announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {errorAnnouncement ? "" : liveAnnouncement}
      </div>
      {/* Assertive live region for error announcements */}
      <div role="status" aria-live="assertive" className="sr-only">
        {errorAnnouncement}
      </div>
      {/* Auth banner */}
      <div className="flex flex-col gap-2 items-start justify-between rounded-lg border-2 border-purple-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:flex-row sm:items-center shadow-md">
        <div>
          {session ? (
            <p className="text-sm text-gray-700">
              Signed in as{" "}
              <span className="font-bold text-purple-600">{session.name ?? session.userId}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-700">
              You are browsing as a guest.{" "}
              <a
                href="/login"
                className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
              >
                Sign in
              </a>{" "}
              to publish posts.
            </p>
          )}
        </div>
        {session ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border-2 border-purple-300 bg-white px-3 py-1.5 text-sm font-medium text-purple-700 transition-all hover:bg-purple-50 hover:border-purple-400 whitespace-nowrap focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 shadow-sm hover:shadow-md"
            onClick={signOut}
          >
            Sign out
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Posts
        </h1>
        <label className="text-sm font-medium text-gray-700">
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
            className="ml-2 rounded-lg border-2 border-purple-200 px-3 py-1.5 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-1 transition-all duration-200 bg-white hover:border-purple-300"
          >
            {POST_SORT_VALUES.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showLoadingState ? (
        <LoadingState message="Loading posts…" />
      ) : showErrorState ? (
        <ErrorState title="Error loading posts" message={errorMessage} onRetry={handleRetry} />
      ) : showEmptyState ? (
        <EmptyState
          title="No posts yet"
          message={
            session?.userId
              ? "Get started by creating your first post! Use the form below to share your thoughts with the community."
              : "There are currently no posts. Sign in to create and share your first post."
          }
        />
      ) : null}

      {posts.length === 0 && (
        <Card
          header={
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create a new post
              </h2>
              <p className="text-sm text-gray-600">
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
            onSuccessAction={handleCreateSuccess}
          />
        </Card>
      )}

      {posts.length > 0 && (
        <>
          <Card
            header={
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Create a new post
                </h2>
                <p className="text-sm text-gray-600">
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
              onSuccessAction={handleCreateSuccess}
            />
          </Card>
          <PostsList
            items={posts}
            currentUserId={session?.userId}
            currentUserRole={session?.role as "owner" | "admin" | undefined}
          />
        </>
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.createElement(SWRConfig as any, { value: swrValue }, <PostsPageClientInner {...props} />)
  );
}
