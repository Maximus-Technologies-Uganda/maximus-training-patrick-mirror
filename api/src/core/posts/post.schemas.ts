import { z } from "zod";

export const PostSchema = z.object({
  id: z.string().uuid(),
  // ownerId is optional for backward compatibility with pre-existing posts
  // that were created before ownership tracking was added
  ownerId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  published: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PostCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(10000),
    tags: z.array(z.string().min(1).max(40)).max(20).optional(),
    published: z.boolean().optional(),
  })
  .strict();

export const PostUpdateSchema = PostCreateSchema.partial().strict().refine(
  (value) => Object.values(value).some((v) => v !== undefined),
  { message: "At least one field must be provided" }
);

export const ListPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type Post = z.infer<typeof PostSchema>;
export type PostCreate = z.infer<typeof PostCreateSchema>;
export type PostUpdate = z.infer<typeof PostUpdateSchema>;
export type ListPostsQuery = z.infer<typeof ListPostsQuerySchema>;


