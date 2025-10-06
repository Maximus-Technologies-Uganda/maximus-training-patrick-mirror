"use client";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SWRCacheValue = State<unknown, any>;

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

export default function PostsPageClient({
  page: initialPage = 1,
  pageSize: initialPageSize = 10,
  q: initialQ = "",
}: {
  page?: number;
  pageSize?: number;
  q?: string;
}): React.ReactElement {
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [q, setQ] = useState<string>(initialQ);

  // Initialize from URL on mount
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const nextPage = Number(url.searchParams.get("page") ?? String(initialPage));
      const nextPageSize = Number(
        url.searchParams.get("pageSize") ?? String(initialPageSize),
      );
      const nextQ = url.searchParams.get("q") ?? initialQ;
      setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1);
      setPageSize(
        Number.isFinite(nextPageSize) && nextPageSize > 0 ? nextPageSize : 10,
      );
      setQ(nextQ);
    } catch (_error) {
      // Ignore malformed URL values; fall back to defaults.
    }
  }, [initialPage, initialPageSize, initialQ]);

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
        setQ(qParam);
      } catch (_error) {
        // Ignore malformed URL values during history navigation.
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const { data, isLoading, error } = usePostsList({ page, pageSize });

  const statusMessage = useMemo(() => {
    return isLoading ? "Loading posts…" : "";
  }, [isLoading]);

  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Focus heading after page change for a11y
    headingRef.current?.focus();
  }, [page, pageSize]);

  const pushQuery = (next: { page?: number; pageSize?: number; q?: string }): void => {
    const url = new URL(window.location.href);
    const newPage = next.page ?? page;
    const newPageSize = next.pageSize ?? pageSize;
    const newQ = next.q ?? q;
    url.searchParams.set("page", String(newPage));
    url.searchParams.set("pageSize", String(newPageSize));
    if (newQ) url.searchParams.set("q", newQ);
    else url.searchParams.delete("q");
    window.history.pushState({}, "", `${url.pathname}?${url.searchParams.toString()}`);
  };

  const onChangePage = (nextPage: number): void => {
    setPage(nextPage);
    pushQuery({ page: nextPage });
  };
  const onChangePageSize = (nextSize: number): void => {
    setPage(1);
    setPageSize(nextSize);
    pushQuery({ page: 1, pageSize: nextSize });
  };
  const onChangeQ = (nextQ: string): void => {
    setQ(nextQ);
    pushQuery({ q: nextQ });
  };

  const onCreateSuccess = (): void => {
    // Reset to first page so the new post is visible and URL stays in sync
    if (page !== 1) {
      setPage(1);
      pushQuery({ page: 1 });
    }
  };

  const filteredItems = useMemo(() => {
    const items = data?.items ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query),
    );
  }, [data?.items, q]);

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
          <SearchInput value={q} onChange={onChangeQ} />
        </div>

        <div className="mt-6">
          <NewPostForm pageSize={pageSize} onSuccess={onCreateSuccess} />
        </div>

        <section className="mt-6" aria-label="Posts list">
          {error ? (
            <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">
              Error loading posts. Please try again.
            </div>
          ) : isLoading ? (
            <p className="text-gray-600">Loading…</p>
          ) : (
            <PostsList items={filteredItems} />
          )}
        </section>

        <PaginationControls
          page={page}
          hasNextPage={Boolean(data?.hasNextPage)}
          onChangePage={onChangePage}
        />
      </main>
    </SWRConfig>
  );
}
