"use client";

import React from "react";

import type { Post } from "../src/lib/schemas";
import { withCsrf } from "../src/lib/auth/csrf";

const MAX_CONTENT_PREVIEW_LENGTH = 200;

function truncate(text: string, max = MAX_CONTENT_PREVIEW_LENGTH): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export default function PostsList({ items, currentUserId, onChanged }: { items: Post[]; currentUserId?: string; onChanged?: () => void }): React.ReactElement {
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
        onChanged?.();
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
      if (res.ok) onChanged?.();
    } catch {
      // ignore
    }
  }

  return (
    <ul role="list" className="space-y-4">
      {items.map((post) => (
        <li
          key={post.id}
          className="rounded border border-gray-200 p-4 shadow-sm bg-white"
        >
          <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
          <p className="mt-2 text-gray-700">{truncate(post.content)}</p>
          <div className="mt-3 flex gap-2">
            {currentUserId && post.ownerId && post.ownerId === currentUserId ? (
              <>
                <button type="button" className="rounded border border-gray-300 px-2 py-1" aria-label="Edit" onClick={() => onEdit(post.id)}>
                  Edit
                </button>
                <button type="button" className="rounded border border-red-300 bg-red-50 px-2 py-1 text-red-700" aria-label="Delete" onClick={() => onDelete(post.id)}>
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}


