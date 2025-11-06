import { z } from "zod";

// Core entity schemas
const PostOwnerSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const PostPermissionsSchema = z.object({
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  published: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  owner: PostOwnerSchema.partial().optional(),
  permissions: PostPermissionsSchema.optional(),
});

export const PostSortSchema = z.enum(["date-desc", "date-asc", "title-desc", "title-asc"]);

export type PostSort = z.infer<typeof PostSortSchema>;

export const POST_SORT_VALUES = PostSortSchema.options;

export const DEFAULT_POST_SORT: PostSort = "date-desc";

export const PostListSchema = z.object({
  items: z.array(PostSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  hasNextPage: z.boolean(),
  total: z.number().int().optional(),
  sort: PostSortSchema.optional(),
});

export const PostCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

// Inferred TS types
export type Post = z.infer<typeof PostSchema>;
export type PostList = z.infer<typeof PostListSchema>;
export type PostCreate = z.infer<typeof PostCreateSchema>;
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
