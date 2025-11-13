"use client";

import type { ReactNode } from "react";
import { PostsTable, type PostRow } from "./PostsTable";
import LiveRegion from "./LiveRegion";

export interface PostsStatesProps {
  /** Table rows to display (empty = empty state) */
  rows: PostRow[];
  /** Error message (non-empty = error state) */
  error?: string;
  /** Loading state (true = loading skeleton) */
  isLoading?: boolean;
}

/**
 * PostsStates: Wrapper component managing posts list state UI
 *
 * States:
 * - Loading: Skeleton table (8 rows) with aria-live announcement
 * - Error: Alert box with retry link, no stack traces
 * - Empty: "No posts found" message with search tips
 * - Success: PostsTable with rows
 *
 * Accessibility:
 * - Live region announces state transitions
 * - Error messages with role="alert"
 * - Keyboard-accessible buttons/links
 * - Screen reader: announces retry action, result count
 *
 * FR-032: Posts state management component
 * FR-005: Accessible state transitions
 */
export function PostsStates({ rows, error, isLoading = false }: PostsStatesProps): ReactNode {
  // Loading state
  if (isLoading) {
    return (
      <>
        <LiveRegion message="Loading posts, please wait" />
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900"
                >
                  Title
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900"
                >
                  Author
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900"
                >
                  Excerpt
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900"
                >
                  Tags
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-900"
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <LiveRegion
          message={`Error loading posts: ${error}. Press enter on the retry link to try again.`}
        />
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="font-semibold mb-2">Failed to load posts</div>
          <p className="text-sm mb-3">{error}</p>
          <a
            href="/posts"
            className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-900 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            Retry
            <span className="sr-only">, refresh posts list</span>
          </a>
        </div>
      </>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return (
      <>
        <LiveRegion message="No posts found matching your search. Try adjusting your filters." />
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600 mb-4">No posts found matching your search.</p>
          <a
            href="/posts"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Clear filters
            <span className="sr-only"> to see all posts</span>
          </a>
        </div>
      </>
    );
  }

  // Success state
  return (
    <>
      <LiveRegion
        message={`Loaded ${rows.length} post${rows.length !== 1 ? "s" : ""}. Displaying results below.`}
      />
      <PostsTable rows={rows} />
    </>
  );
}
