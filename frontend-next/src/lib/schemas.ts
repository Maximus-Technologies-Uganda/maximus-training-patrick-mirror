import { z } from "zod";

// Core entity schemas
export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  published: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PostListSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  hasNextPage: z.boolean(),
  items: z.array(PostSchema),
  totalItems: z.number().optional(),
  totalPages: z.number().optional(),
  currentPage: z.number().optional(),
});

export const PostCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

// Inferred TS types
export type Post = z.infer<typeof PostSchema>;
export type PostList = z.infer<typeof PostListSchema>;
export type PostCreate = z.infer<typeof PostCreateSchema>;


