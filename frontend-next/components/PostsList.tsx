"use client";

import React from "react";

import type { Post } from "../src/lib/schemas";
import { withCsrf } from "../src/lib/auth/csrf";

interface PostListProps {
  items: Post[];
  currentUserId?: string | null;
  currentUserRole?: "owner" | "admin";
}

function deriveOwner(post: Post): { id: string | null; name: string | null } {
  if (post.owner) {
    return {
      id: post.owner.id ?? null,
      name: post.owner.name ?? null,
    };
  }
  return {
    id: post.ownerId ?? null,
    name: post.ownerName ?? null,
  };
}

function canManagePost(
  post: Post,
  currentUserId: string | null | undefined,
  currentUserRole?: "owner" | "admin"
): {
  canEdit: boolean;
  canDelete: boolean;
} {
  const permissions = post.permissions;
  if (permissions) {
    return {
      canEdit: Boolean(permissions.canEdit),
      canDelete: Boolean(permissions.canDelete),
    };
  }
  const owner = deriveOwner(post);
  const isOwner = Boolean(owner.id && currentUserId && owner.id === currentUserId);
  const isAdmin = currentUserRole === "admin";
  return { canEdit: isOwner || isAdmin, canDelete: isOwner || isAdmin };
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export default function PostsList({
  items,
  currentUserId,
  currentUserRole,
}: PostListProps): React.ReactElement {
  if (!items.length) {
    return (
      <p className="text-gray-600" aria-live="polite">
        No posts yet
      </p>
    );
  }

  async function onDelete(id: string): Promise<void> {
    try {
      const res = await fetch(
        `/api/posts/${encodeURIComponent(id)}`,
        withCsrf({ method: "DELETE" })
      );
      if (res.status === 204 || res.status === 200) {
        // Post deleted successfully
      }
    } catch {
      // ignore for now; parent shows list state
    }
  }

  async function onEdit(id: string): Promise<void> {
    const title = prompt("New title?");
    const content = title != null ? prompt("New content?") : null;
    if (title == null || content == null) return;
    try {
      const res = await fetch(
        `/api/posts/${encodeURIComponent(id)}`,
        withCsrf({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        })
      );
      if (res.ok) {
        // Post updated successfully
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200" aria-label="Posts table">
        <caption className="sr-only">Posts</caption>
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Title &amp; excerpt
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Owner
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Tags
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((post) => {
            const owner = deriveOwner(post);
            const permissions = canManagePost(post, currentUserId ?? null, currentUserRole);
            return (
              <tr key={post.id} className="bg-white">
                <td className="px-4 py-3 align-top">
                  <div className="text-sm font-semibold text-gray-900">{post.title}</div>
                  <p className="mt-2 text-sm text-gray-700">{truncate(post.content)}</p>
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-700">
                  {owner.name ?? owner.id ?? "Unknown"}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-1" aria-label="Post tags">
                    {(post.tags ?? []).length === 0 ? (
                      <span className="text-xs text-gray-400">No tags</span>
                    ) : (
                      (post.tags ?? []).map((tag) => (
                        <span
                          key={`${post.id}-${tag}`}
                          className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
                        >
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  {permissions.canEdit || permissions.canDelete ? (
                    <div
                      className="flex flex-col gap-2 sm:flex-row sm:items-center"
                      aria-label="Post actions"
                    >
                      {permissions.canEdit ? (
                        <button
                          type="button"
                          className="rounded border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                          onClick={() => onEdit(post.id)}
                        >
                          Edit
                        </button>
                      ) : null}
                      {permissions.canDelete ? (
                        <button
                          type="button"
                          className="rounded border border-red-300 px-3 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50"
                          onClick={() => onDelete(post.id)}
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No edit or delete permissions.</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
