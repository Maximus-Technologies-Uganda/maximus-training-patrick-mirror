import { z } from 'zod';

/**
 * Query parameter validation schema for Posts filtering
 * Enforces RFC-compliant parameter validation and normalization
 * FR-004: Query parameter validation
 * FR-011: Contract definitions for query parameters
 * FR-023: Canonical cache key builder input
 */

export const querySchema = z
  .object({
    /**
     * Full-text search query
     * Must be 1-64 characters when provided
     * Trimmed and normalized
     */
    q: z.string().trim().min(1).max(64).optional(),

    /**
     * Author filter (slug format)
     * Must match [a-z0-9-]{2,32} when provided
     * Alphanumeric and hyphen only, 2-32 chars
     */
    author: z
      .string()
      .regex(/^[a-z0-9-]{2,32}$/)
      .optional(),

    /**
     * Sort order
     * Allowed values: 'new' (default, newest first), 'old' (oldest first)
     * Invalid values rejected; defaults to 'new'
     */
    sort: z.enum(['new', 'old']).default('new'),
  })
  .transform((raw) => {
    const cleaned: Record<string, string> = {};
    if (raw.q && raw.q.length) cleaned.q = raw.q;
    if (raw.author) cleaned.author = raw.author;
    if (raw.sort) cleaned.sort = raw.sort;
    return cleaned;
  });

export type QueryParams = z.infer<typeof querySchema>;

/**
 * Status response contract
 * Always returns 200 with structured payload
 * FR-021: Status endpoint contract and behavior
 */
export const statusResponseSchema = z.object({
  /**
   * Overall health indicator
   * true: all systems operational
   * false: one or more upstream issues
   */
  ok: z.boolean(),

  /**
   * Request trace ID for correlation
   * Used to correlate logs across services
   * FR-013: Trace propagation
   */
  traceId: z.string().uuid(),

  /**
   * Upstream service status
   */
  upstream: z.object({
    ok: z.boolean(),
    latency_ms: z.number().nonnegative().optional(),
    status: z.number().int().optional(),
  }),

  /**
   * Response timestamp (ISO 8601)
   */
  ts: z.string().datetime(),

  /**
   * Human-readable failure reason (when ok: false)
   * No secrets, tokens, or internal IDs
   * FR-024: Limit /status payload to non-sensitive fields
   */
  reason: z.string().optional(),
});

export type StatusResponse = z.infer<typeof statusResponseSchema>;

/**
 * Post entity contract
 */
export const postSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(140),
  author: z.string(),
  body: z.string(),
  createdAt: z.string().datetime(),
  tags: z.array(z.string()).max(8),
});

export type Post = z.infer<typeof postSchema>;

/**
 * Posts list response contract
 */
export const postsResponseSchema = z.object({
  data: z.array(postSchema),
  total: z.number().nonnegative(),
  page: z.number().nonnegative(),
  pageSize: z.number().positive(),
});

export type PostsResponse = z.infer<typeof postsResponseSchema>;

/**
 * Error response shape (standardized across API)
 * FR-027: Zod parse failures mapped to single user-facing message
 */
export const errorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.record(z.string(), z.any()).optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
