import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const specPath = path.resolve(
  __dirname,
  '../../../specs/008-identity-platform/contracts/openapi.yaml',
);

const healthSpecSchema = z.object({
  components: z.object({
    schemas: z.object({
      HealthResponse: z
        .object({
          type: z.literal('object'),
          required: z.array(z.string()),
          properties: z
            .object({
              service: z.object({ type: z.literal('string') }).passthrough(),
              status: z
                .object({ type: z.literal('string'), enum: z.array(z.string()) })
                .passthrough(),
              commit: z.object({ type: z.literal('string') }).passthrough(),
              time: z
                .object({ type: z.literal('string'), format: z.literal('date-time') })
                .passthrough(),
              uptime_s: z
                .object({ type: z.literal('number'), format: z.literal('double') })
                .passthrough(),
              dependencies: z
                .object({ $ref: z.literal('#/components/schemas/HealthDependencies') })
                .passthrough(),
            })
            .passthrough(),
        })
        .passthrough(),
      HealthDependencies: z
        .object({
          type: z.literal('object'),
          required: z.array(z.string()),
          properties: z
            .object({
              firebase: z
                .object({ $ref: z.literal('#/components/schemas/HealthDependencyStatus') })
                .passthrough(),
              db: z
                .object({ $ref: z.literal('#/components/schemas/HealthDependencyStatus') })
                .passthrough(),
              details: z
                .object({
                  type: z.literal('object'),
                  additionalProperties: z.object({ type: z.literal('string') }).passthrough(),
                })
                .passthrough()
                .optional(),
            })
            .passthrough(),
        })
        .passthrough(),
    }),
  }),
  paths: z.object({
    '/health': z.object({
      get: z.object({
        responses: z.object({
          '200': z.object({
            content: z.object({
              'application/json': z.object({
                schema: z.object({ $ref: z.literal('#/components/schemas/HealthResponse') }),
                example: z
                  .object({
                    service: z.string(),
                    status: z.string(),
                    commit: z.string(),
                    time: z.string(),
                    uptime_s: z.number(),
                    dependencies: z
                      .object({
                        firebase: z.string(),
                        db: z.string(),
                      })
                      .passthrough(),
                  })
                  .passthrough(),
              }),
            }),
          }),
          '503': z.object({
            content: z.object({
              'application/json': z.object({
                schema: z.object({ $ref: z.literal('#/components/schemas/HealthResponse') }),
                example: z
                  .object({
                    service: z.string(),
                    status: z.string(),
                    commit: z.string(),
                    time: z.string(),
                    uptime_s: z.number(),
                    dependencies: z
                      .object({
                        firebase: z.string(),
                        db: z.string(),
                        details: z.object({ db: z.string() }).passthrough(),
                      })
                      .passthrough(),
                  })
                  .passthrough(),
              }),
            }),
          }),
        }),
      }),
    }),
  }),
});

describe('OpenAPI /health schema', () => {
  const spec = healthSpecSchema.parse(parse(readFileSync(specPath, 'utf8')));

  it('declares required fields and dependency references', () => {
    const requiredFields = spec.components.schemas.HealthResponse.required;
    expect(requiredFields).toEqual(
      expect.arrayContaining(['service', 'status', 'commit', 'time', 'uptime_s', 'dependencies']),
    );

    const dependencyRequired = spec.components.schemas.HealthDependencies.required;
    expect(dependencyRequired).toEqual(expect.arrayContaining(['firebase', 'db']));
  });

  it('documents healthy example payload', () => {
    const healthyExample =
      spec.paths['/health'].get.responses['200'].content['application/json'].example;
    expect(healthyExample.status).toBe('ok');
    expect(typeof healthyExample.uptime_s).toBe('number');
    expect(healthyExample.dependencies.firebase).toBe('ok');
    expect(healthyExample.dependencies.db).toBe('ok');
  });

  it('documents degraded example payload with dependency details', () => {
    const degradedExample =
      spec.paths['/health'].get.responses['503'].content['application/json'].example;
    expect(degradedExample.status).toBe('degraded');
    expect(degradedExample.dependencies.db).toBe('down');
    expect(degradedExample.dependencies.details.db).toMatch(/db error/i);
  });
});
