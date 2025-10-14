"use client";

import React from "react";

import type { Post } from "../src/lib/schemas";

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export default function PostsList({ items, currentUserId }: { items: Post[]; currentUserId?: string }): React.ReactElement {
  if (!items.length) {
    return (
      <p className="text-gray-600" aria-live="polite">
        No posts yet
      </p>
    );
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
                <button type="button" className="rounded border border-gray-300 px-2 py-1" aria-label="Edit">
                  Edit
                </button>
                <button type="button" className="rounded border border-red-300 bg-red-50 px-2 py-1 text-red-700" aria-label="Delete">
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


