// Shared API-facing TypeScript types for the frontend application
// These types represent the fields actually consumed by the UI and
// the standard error envelope used by server Route Handlers.

import type { z } from "zod";

import { PostSchema, PostListSchema, PostCreateSchema } from "../schemas";

// Core entity and collection types (derived from Zod schemas to avoid drift)
export type Post = z.infer<typeof PostSchema>;
export type PostList = z.infer<typeof PostListSchema>;
export type PostCreate = z.infer<typeof PostCreateSchema>;

// Query params accepted by list endpoints (client-side usage)
export interface ListQueryParams {
  page: number;
  pageSize: number;
}

// Error envelope returned by server handlers for non-2xx responses
export interface ApiError {
  code: number;
  message: string;
}

export interface ErrorEnvelope {
  error: ApiError;
}


