import { z } from 'zod';

export const querySchema = z
  .object({
    q: z.string().trim().min(1).max(64).optional(),
    author: z
      .string()
      .regex(/^[a-z0-9-]{2,32}$/)
      .optional(),
    sort: z.enum(['new', 'top']).default('new'),
  })
  .transform((raw) => {
    const cleaned: Record<string, string> = {};
    if (raw.q && raw.q.length) cleaned.q = raw.q;
    if (raw.author) cleaned.author = raw.author;
    if (raw.sort) cleaned.sort = raw.sort;
    return cleaned;
  });

export type QueryParams = z.infer<typeof querySchema>;
