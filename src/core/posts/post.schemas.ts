import { z } from "zod";

/**
 * PostSchema: The core entity schema for a blog post.
 * Represents how a Post is stored and returned by the server.
 */
export const PostSchema = z.object({
  /** Unique identifier for the post */
  id: z.string().uuid(),
  /** Human-readable title of the post */
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  /** Main body content of the post */
  content: z.string().min(10, "Content must be at least 10 characters"),
  /** Optional tags for the post */
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  /** Whether the post is published */
  published: z.boolean().default(false),
  /** Creation timestamp (set by server) */
  createdAt: z.date(),
  /** Last update timestamp (set by server) */
  updatedAt: z.date(),
});

/**
 * PostCreateSchema: Input schema for creating a post.
 * Omits server-generated fields: id, createdAt, updatedAt.
 */
export const PostCreateSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
    content: z.string().min(10, "Content must be at least 10 characters"),
    tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    published: z.boolean().optional(),
  })
  .strict();

/**
 * PostUpdateSchema: Input schema for updating a post.
 * All fields are optional but at least one must be provided.
 */
export const PostUpdateSchema = PostCreateSchema.partial().strict().refine(
  (value) => Object.values(value).some((v) => v !== undefined),
  {
    message: "At least one field must be provided",
  }
);

/**
 * ListPostsQuerySchema: Schema for pagination when listing posts.
 */
export const ListPostsQuerySchema = z.object({
  /** Page number, starting from 1 */
  page: z.coerce.number().int().positive().default(1),
  /** Page size limit (max 100) */
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

// Inferred TypeScript types
export type Post = z.infer<typeof PostSchema>;
export type PostCreate = z.infer<typeof PostCreateSchema>;
export type PostUpdate = z.infer<typeof PostUpdateSchema>;
export type ListPostsQuery = z.infer<typeof ListPostsQuerySchema>;


