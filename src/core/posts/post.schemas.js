"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPostsQuerySchema = exports.PostUpdateSchema = exports.PostCreateSchema = exports.PostSchema = void 0;
const zod_1 = require("zod");
/**
 * PostSchema: The core entity schema for a blog post.
 * Represents how a Post is stored and returned by the server.
 */
exports.PostSchema = zod_1.z.object({
    /** Unique identifier for the post */
    id: zod_1.z.string().uuid(),
    /** Human-readable title of the post */
    title: zod_1.z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
    /** Main body content of the post */
    content: zod_1.z.string().min(10, "Content must be at least 10 characters"),
    /** Optional tags for the post */
    tags: zod_1.z.array(zod_1.z.string().min(1).max(40)).max(20).default([]),
    /** Whether the post is published */
    published: zod_1.z.boolean().default(false),
    /** Creation timestamp (set by server) */
    createdAt: zod_1.z.date(),
    /** Last update timestamp (set by server) */
    updatedAt: zod_1.z.date(),
});
/**
 * PostCreateSchema: Input schema for creating a post.
 * Omits server-generated fields: id, createdAt, updatedAt.
 */
exports.PostCreateSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
    content: zod_1.z.string().min(10, "Content must be at least 10 characters"),
    tags: zod_1.z.array(zod_1.z.string().min(1).max(40)).max(20).optional(),
    published: zod_1.z.boolean().optional(),
})
    .strict();
/**
 * PostUpdateSchema: Input schema for updating a post.
 * All fields are optional but at least one must be provided.
 */
exports.PostUpdateSchema = exports.PostCreateSchema.partial().strict().refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "At least one field must be provided",
});
/**
 * ListPostsQuerySchema: Schema for pagination when listing posts.
 */
exports.ListPostsQuerySchema = zod_1.z.object({
    /** Page number, starting from 1 */
    page: zod_1.z.coerce.number().int().positive().default(1),
    /** Page size limit (max 100) */
    pageSize: zod_1.z.coerce.number().int().positive().max(100).default(10),
});
