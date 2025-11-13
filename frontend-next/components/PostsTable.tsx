"use client";

import type { ReactNode } from "react";
import { Table } from "./Table";
import { Badge } from "./Badge";

/**
 * Post row data structure from API
 * FR-032: Post table component rendering
 */
export interface PostRow {
  id: string;
  title: string;
  author: string;
  excerpt?: string;
  createdAt: string;
  tags?: string[];
}

/**
 * PostsTable: Client component for rendering paginated post rows
 *
 * Features:
 * - SSR-compatible: rows prop passed from server
 * - Accessible table structure with proper headers
 * - Truncated excerpts for readability
 * - Tag badge display (max 3)
 * - Empty state handled by parent (PostsStates)
 * - Loading placeholders handled by parent
 *
 * Accessibility:
 * - Semantic <table> with <thead>/<tbody>
 * - Column headers with scope="col"
 * - Row focus with keyboard navigation
 *
 * FR-032: Post table component
 * FR-005: Accessible table rendering
 */
export function PostsTable({ rows }: { rows: PostRow[] }): ReactNode {
  if (rows.length === 0) {
    // Empty state handled by parent (PostsStates)
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <Table>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Title
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Author
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Excerpt
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Tags
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Created
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td className="px-4 py-3">
                <a
                  href={`/posts/${row.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {row.title}
                </a>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">{row.author}</td>
              <td className="px-4 py-3 text-sm text-slate-600">
                {row.excerpt && row.excerpt.length > 60
                  ? `${row.excerpt.substring(0, 60)}…`
                  : row.excerpt || "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {(row.tags ?? []).slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" size="sm">
                      {tag}
                    </Badge>
                  ))}
                  {(row.tags ?? []).length > 3 && (
                    <span className="text-xs text-slate-500">+{(row.tags ?? []).length - 3}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(row.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
