/**
 * Contract Schemas Package
 * Shared Zod schemas and types for Frontend Foundations Week 10
 *
 * This package consolidates schemas used by both frontend and API
 * to ensure SSR/SWR parity and consistent validation.
 *
 * Tasks:
 * - T013: Migrate schemas from specs/001-frontend-ssr-hardening/contracts/query.zod.ts
 * - Export FilterState, HealthStatus, and error shape schemas
 */

import { z } from 'zod';

/**
 * Query/Filter State Schema
 * Validates URL search parameters and filter inputs
 *
 * Parameters:
 * - q: search query (optional, max 64 chars)
 * - author: author slug filter (optional, slug format)
 * - sort: sort order (optional, 'new' or 'top', defaults to 'new')
 */
export const FilterStateSchema = z.object({
  q: z.string().trim().max(64).optional().or(z.literal('')),
  author: z
    .string()
    .regex(/^[a-z0-9-]{2,32}$/)
    .optional(),
  sort: z.enum(['new', 'top']).default('new').optional(),
});

export type FilterState = z.infer<typeof FilterStateSchema>;

/**
 * Health Status Schema
 * Represents the response from /status endpoint
 *
 * Fields:
 * - ok: boolean indicating overall health
 * - traceId: unique request correlation ID
 * - upstream: upstream service health
 * - ts: ISO 8601 timestamp
 * - reason: optional reason if ok=false
 */
export const HealthStatusSchema = z.object({
  ok: z.boolean(),
  traceId: z.string().uuid().or(z.string().min(1)),
  upstream: z
    .object({
      ok: z.boolean(),
      latency_ms: z.number().optional(),
      status: z.number().optional(),
    })
    .optional(),
  ts: z.string().datetime(),
  reason: z.string().optional(),
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;

/**
 * Error Response Schema
 * Standardized error shape for API responses
 */
export const ErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    traceId: z.string().optional(),
  }),
});

export type ApiError = z.infer<typeof ErrorSchema>;

// Re-export all schemas and types
export {
  FilterStateSchema as QuerySchema,
  type FilterState as QueryState,
  HealthStatusSchema,
  type HealthStatus,
  ErrorSchema,
  type ApiError,
};
