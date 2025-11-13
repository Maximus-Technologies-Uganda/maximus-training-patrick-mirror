"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { z } from "zod";

import { Button } from "./Button";
import { Input } from "./Input";
import { mutatePostsPage1 } from "../lib/swr";
import { withCsrf } from "../lib/auth/csrf";
import { DEFAULT_POST_SORT, type PostSort } from "../lib/schemas";
import { cn } from "../lib/utils";

const FormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type FormValues = z.infer<typeof FormSchema>;

type FieldErrors = Partial<Record<keyof FormValues, string>>;

export interface NewPostFormProps {
  pageSize: number;
  sort?: PostSort;
  query?: string;
  onSuccessAction?: () => void;
  className?: string;
}

export function NewPostForm({
  pageSize,
  sort = DEFAULT_POST_SORT,
  query = "",
  onSuccessAction,
  className,
}: NewPostFormProps): React.ReactElement {
  const [values, setValues] = useState<FormValues>({ title: "", content: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const successRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (successMessage) {
      successRef.current?.focus();
    }
  }, [successMessage]);

  const resetForm = useCallback(() => {
    setValues({ title: "", content: "" });
    setFieldErrors({});
    setFormError(null);
  }, []);

  const handleChange = useCallback(
    (field: keyof FormValues) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: event.target.value }));
        if (fieldErrors[field]) {
          setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
        if (formError) {
          setFormError(null);
        }
      },
    [fieldErrors, formError]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSuccessMessage(null);
      setFormError(null);

      const parsed = FormSchema.safeParse(values);
      if (!parsed.success) {
        const nextErrors: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path?.[0];
          if (typeof path === "string" && !nextErrors[path as keyof FormValues]) {
            nextErrors[path as keyof FormValues] = issue.message || "Required";
          }
        }
        setFieldErrors(nextErrors);
        if (nextErrors.title) {
          titleRef.current?.focus();
        } else if (nextErrors.content) {
          contentRef.current?.focus();
        }
        return;
      }

      setFieldErrors({});
      setIsSubmitting(true);
      try {
        const response = await fetch(
          "/api/posts",
          withCsrf({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: parsed.data.title,
              content: parsed.data.content,
              published: true,
              tags: [],
            }),
          })
        );

        if (response.status === 201) {
          resetForm();
          setSuccessMessage("Post created successfully");
          await mutatePostsPage1(pageSize, sort, query);
          onSuccessAction?.();
          return;
        }

        let message = "Failed to create post";
        try {
          const payload = (await response.json()) as {
            message?: string;
            error?: { code?: string; message?: string };
          };
          if (payload?.error?.message) {
            message = payload.error.message;
          } else if (payload?.message) {
            message = payload.message;
          }
          // Provide user-friendly error messages
          if (
            response.status === 401 ||
            message.includes("authentication") ||
            message.includes("unauthorized")
          ) {
            message = "Your session has expired. Please sign in again.";
          } else if (response.status === 403) {
            message = "You don't have permission to create posts.";
          } else if (response.status === 400 && message.includes("CSRF")) {
            message = "Security token missing. Please refresh the page and try again.";
          }
        } catch {
          // ignore malformed payloads
        }
        setFormError(message);
      } catch {
        setFormError("Network error while creating post");
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, pageSize, sort, query, resetForm, onSuccessAction]
  );

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {successMessage ? (
        <div
          ref={successRef}
          role="alert"
          tabIndex={-1}
          className="rounded border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success"
        >
          {successMessage}
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="rounded border border-error/30 bg-error/10 px-3 py-2 text-sm text-error"
        >
          {formError}
        </div>
      ) : null}

      <Input
        ref={titleRef}
        label="Title"
        value={values.title}
        onChange={handleChange("title")}
        error={fieldErrors.title}
        placeholder="Post title"
        aria-label="Title"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-text" htmlFor="new-post-content">
          Content
        </label>
        <textarea
          id="new-post-content"
          ref={contentRef}
          value={values.content}
          onChange={handleChange("content")}
          aria-label="Content"
          aria-invalid={fieldErrors.content ? "true" : "false"}
          aria-describedby={fieldErrors.content ? "new-post-content-error" : undefined}
          className="block w-full resize-vertical rounded-sm border border-gray-300 bg-surface px-3 py-2 text-sm text-text shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
        />
        {fieldErrors.content ? (
          <p id="new-post-content-error" role="alert" className="text-sm text-error">
            {fieldErrors.content}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Create
        </Button>
      </div>
    </form>
  );
}

export default NewPostForm;
