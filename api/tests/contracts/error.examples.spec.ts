import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const specPath = path.resolve(
  __dirname,
  '../../../specs/008-identity-platform/contracts/openapi.yaml',
);

const validationDetailSchema = z
  .object({
    path: z.string(),
    issue: z.string(),
  })
  .passthrough();

const rateLimitDetailSchema = z
  .object({
    scope: z.string(),
    limit: z.string(),
    retryAfterSeconds: z.number(),
  })
  .passthrough();

const responseExamplesSchema = z.object({
  components: z.object({
    responses: z.object({
      Err422: z.object({
        content: z.object({
          'application/json': z.object({
            example: z.object({
              code: z.string(),
              message: z.string(),
              requestId: z.string(),
              details: z.array(validationDetailSchema).min(1),
            }),
          }),
        }),
      }),
      Err429: z.object({
        content: z.object({
          'application/json': z.object({
            example: z.object({
              code: z.string(),
              message: z.string(),
              requestId: z.string(),
              details: z.array(rateLimitDetailSchema).min(1),
            }),
          }),
        }),
      }),
    }),
  }),
});

describe('OpenAPI error response examples', () => {
  const examples = responseExamplesSchema.parse(parse(readFileSync(specPath, 'utf8')));

  it('provides validation error details as an array of path/issue objects for 422', () => {
    const validationExample =
      examples.components.responses.Err422.content['application/json'].example;
    expect(validationExample.details).toHaveLength(2);
    validationExample.details.forEach((detail) => {
      expect(typeof detail.path).toBe('string');
      expect(detail.path.length).toBeGreaterThan(0);
      expect(typeof detail.issue).toBe('string');
      expect(detail.issue.length).toBeGreaterThan(0);
    });
  });

  it('provides rate limit diagnostics for 429 as an array', () => {
    const rateLimitExample =
      examples.components.responses.Err429.content['application/json'].example;
    expect(rateLimitExample.details).toHaveLength(1);
    const [detail] = rateLimitExample.details;
    expect(detail.scope).toBe('ip');
    expect(detail.limit).toMatch(/requests per/);
    expect(detail.retryAfterSeconds).toBeGreaterThan(0);
  });
});
