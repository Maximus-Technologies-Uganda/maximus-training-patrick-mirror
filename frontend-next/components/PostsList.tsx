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
  currentUserRole?: "owner" | "admin",
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

export default function PostsList({ items, currentUserId, currentUserRole }: PostListProps): React.ReactElement {
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
        withCsrf({ method: "DELETE" }),
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
        }),
      );
      if (res.ok) {
        // Post updated successfully
      }
    } catch {
      // ignore
    }
  }

  return (
    <ul role="list" className="space-y-4">
      {items.map((post) => {
        const owner = deriveOwner(post);
        const permissions = canManagePost(post, currentUserId ?? null, currentUserRole);
        return (
          <li
            key={post.id}
            className="rounded border border-gray-200 p-4 shadow-sm bg-white"
          >
            <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
            <p className="mt-2 text-gray-700">{truncate(post.content)}</p>
            {owner.id || owner.name ? (
              <p className="mt-2 text-sm text-gray-500">
                Owned by {owner.name ?? "Unknown"}
              </p>
            ) : null}
            {permissions.canEdit || permissions.canDelete ? (
              <div className="mt-3 flex gap-2" aria-label="Post actions">
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
              <p className="mt-3 text-sm text-gray-500">
                You do not have permission to edit or delete this post.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}


