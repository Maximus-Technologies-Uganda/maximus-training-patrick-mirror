"use client";

import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { mutatePostsPage1 } from "../src/lib/swr";

const FormSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export default function NewPostForm({
  pageSize,
  onSuccess,
}: {
  pageSize: number;
  onSuccess?: () => void;
}): React.ReactElement {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Focus the success alert after it is rendered
  useEffect(() => {
    if (success) {
      successRef.current?.focus();
    }
  }, [success]);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = FormSchema.safeParse({ title, content });
    if (!parsed.success) {
      setError("Please fill in all required fields.");
      return;
    }

    const res = await fetch(`/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Ensure HttpOnly session cookie is sent to the Next.js route handler
      // which forwards it to the upstream API.
      credentials: "include",
      body: JSON.stringify({ title, content, published: true, tags: [] }),
    });
    if (res.status === 201) {
      setTitle("");
      setContent("");
      setSuccess("Created successfully");
      await mutatePostsPage1(pageSize);
      // Notify parent so it can reset pagination and URL
      onSuccess?.();
    } else {
      setError("Failed to create post");
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded border border-gray-200 p-4">
      {success && (
        <div
          ref={successRef}
          role="alert"
          tabIndex={-1}
          className="mb-3 rounded border border-green-300 bg-green-50 p-2 text-green-800"
        >
          {success}
        </div>
      )}
      {error && (
        <div role="alert" className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-red-800">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-gray-700">
          Title
          <input
            aria-label="Title"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm text-gray-700 sm:col-span-2">
          Content
          <textarea
            aria-label="Content"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-white">
          Create
        </button>
      </div>
    </form>
  );
}
