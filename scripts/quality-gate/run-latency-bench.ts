import { createHmac } from 'node:crypto';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import request from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { z } from 'zod';
import { createApp } from '../../api/src/app';
import { loadConfigFromEnv } from '../../api/src/config';
import { InMemoryPostsRepository } from '../../api/src/repositories/posts.repository';
import { signJwt } from '../../api/src/core/auth/auth.middleware';

type ScenarioResult = {
  name: string;
  count: number;
  concurrency: number;
  durations: number[];
  errors: Array<{ index: number; error: unknown }>;
};

type ScenarioSummary = {
  name: string;
  count: number;
  concurrency: number;
  p50: number;
  p95: number;
  errorCount: number;
};

type BenchConfig = {
  readIterations: number;
  readConcurrency: number;
  writeIterations: number;
  writeConcurrency: number;
  thresholdMs: number;
  artifactPath: string;
  artifactRelative: string;
  httpMetricsPath: string;
  httpMetricsRelative: string;
};

const DEFAULT_CONFIG: BenchConfig = {
  readIterations: 100,
  readConcurrency: 5,
  writeIterations: 20,
  writeConcurrency: 5,
  thresholdMs: 300,
  artifactPath: path.join(process.cwd(), 'gate', 'latency.json'),
  artifactRelative: path.join('gate', 'latency.json'),
  httpMetricsPath: path.join(process.cwd(), 'gate', 'http-metrics.json'),
  httpMetricsRelative: path.join('gate', 'http-metrics.json'),
};

/**
 * Ensures that a deterministic session secret exists during benchmarking so JWT and CSRF helpers can operate.
 * The generated secret is intentionally predictable because the benchmark runs locally against an in-memory app.
 */
function ensureSessionSecret(): string {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = 'bench-secret-please-change';
  }
  return process.env.SESSION_SECRET;
}

/**
 * Produces a signed session cookie for the synthetic benchmark user.
 */
function createSessionCookie(userId: string, role: string): string {
  const secret = ensureSessionSecret();
  const token = signJwt({ userId, role }, secret, 15 * 60);
  return `session=${token}`;
}

/**
 * Mirrors the CSRF token generation logic so POST requests pass middleware validation.
 */
function createCsrfToken(userId: string): string {
  const secret = ensureSessionSecret();
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', secret)
    .update(`${userId}.${timestamp}`)
    .digest('hex')
    .slice(0, 32);
  return `${timestamp}-${sig}`;
}

/**
 * Executes a benchmark scenario with a bounded level of concurrency, recording latency measurements and surfaced errors.
 */
async function runScenario(
  name: string,
  total: number,
  concurrency: number,
  task: (index: number) => Promise<void>,
): Promise<ScenarioResult> {
  const durations: number[] = [];
  const errors: Array<{ index: number; error: unknown }> = [];
  let started = 0;
  let completed = 0;

  return new Promise((resolve) => {
    const launch = () => {
      if (started >= total) {
        if (completed >= total) {
          resolve({ name, count: total, concurrency, durations, errors });
        }
        return;
      }
      const current = started++;
      const start = performance.now();
      task(current)
        .catch((error) => {
          errors.push({ index: current, error });
        })
        .finally(() => {
          durations.push(performance.now() - start);
          completed += 1;
          if (completed >= total) {
            resolve({ name, count: total, concurrency, durations, errors });
          } else {
            launch();
          }
        });
    };

    for (let i = 0; i < Math.min(concurrency, total); i += 1) {
      launch();
    }
  });
}

function summarizeResponse(response: SupertestResponse): string {
  const parts: string[] = [];
  if (response.headers?.['content-type']) {
    parts.push(`content-type=${response.headers['content-type']}`);
  }
  if (response.body && Object.keys(response.body).length > 0) {
    try {
      parts.push(`body=${JSON.stringify(response.body)}`);
    } catch {
      parts.push(`body=[unserializable]`);
    }
  } else if (response.text) {
    parts.push(`body=${response.text}`);
  }
  if (response.error) {
    parts.push(`error=${response.error.message}`);
  }
  return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

function assertStatus(response: SupertestResponse, expectedStatus: number, label: string): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label} expected HTTP ${expectedStatus} but received ${response.status}${summarizeResponse(response)}`,
    );
  }
}

/**
 * Calculates the requested percentile using a simple sorted array approach.
 */
function percentile(values: number[], target: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((target / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

/**
 * Converts verbose scenario results into a compact summary used for reporting and thresholds.
 */
function toSummary(result: ScenarioResult): ScenarioSummary {
  return {
    name: result.name,
    count: result.count,
    concurrency: result.concurrency,
    p50: percentile(result.durations, 50),
    p95: percentile(result.durations, 95),
    errorCount: result.errors.length,
  };
}

function formatRow(summary: ScenarioSummary): string {
  return `| ${summary.name} | ${summary.count} | ${summary.concurrency} | ${summary.p50.toFixed(2)} | ${summary.p95.toFixed(2)} |`;
}

/**
 * Writes a GitHub summary (when available) and mirrors the report to stdout for local execution.
 */
function appendSummary(
  results: ScenarioSummary[],
  thresholdMs: number,
  artifactRelativePath: string,
  metricsRelativePath: string,
): void {
  const lines = [
    '## Latency Bench',
    '',
    '| Operation | N | Concurrency | P50(ms) | P95(ms) |',
    '| --- | --- | --- | --- | --- |',
    ...results.map(formatRow),
    '',
    `Threshold: ${thresholdMs}ms p95 (warnings emitted when exceeded)`,
    `Artifact: ${artifactRelativePath}`,
    `HTTP Metrics: ${metricsRelativePath}`,
    '',
  ];
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    appendFileSync(summaryFile, `${lines.join('\n')}\n`);
  }
  console.log(lines.join('\n'));
}

const positiveIntegerSchema = z.coerce
  .number({ invalid_type_error: 'Expected a numeric value' })
  .int({ message: 'Expected an integer' })
  .gt(0, { message: 'Value must be greater than zero' });

const nonNegativeNumberSchema = z.coerce
  .number({ invalid_type_error: 'Expected a numeric value' })
  .min(0, { message: 'Value must be greater than or equal to zero' });

function parsePositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim().length === 0) {
    return fallback;
  }
  const result = positiveIntegerSchema.safeParse(rawValue);
  if (!result.success) {
    throw new Error(`${name} must be a positive integer (received: ${rawValue})`);
  }
  return result.data;
}

function parseNonNegativeNumber(name: string, fallback: number): number {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.trim().length === 0) {
    return fallback;
  }
  const result = nonNegativeNumberSchema.safeParse(rawValue);
  if (!result.success) {
    throw new Error(`${name} must be a non-negative number (received: ${rawValue})`);
  }
  return result.data;
}

/**
 * Builds the benchmark configuration from environment overrides, resolving artifact paths relative to the repo root.
 */
function loadBenchConfig(): BenchConfig {
  const repoRoot = process.cwd();
  const artifactEnv = process.env.LATENCY_BENCH_ARTIFACT;
  const artifactRelative =
    artifactEnv && artifactEnv.trim().length > 0
      ? artifactEnv.trim()
      : DEFAULT_CONFIG.artifactRelative;
  const artifactPath = path.isAbsolute(artifactRelative)
    ? artifactRelative
    : path.join(repoRoot, artifactRelative);
  const httpMetricsEnv = process.env.LATENCY_BENCH_HTTP_METRICS;
  const httpMetricsRelative =
    httpMetricsEnv && httpMetricsEnv.trim().length > 0
      ? httpMetricsEnv.trim()
      : DEFAULT_CONFIG.httpMetricsRelative;
  const httpMetricsPath = path.isAbsolute(httpMetricsRelative)
    ? httpMetricsRelative
    : path.join(repoRoot, httpMetricsRelative);

  return {
    readIterations: parsePositiveInteger(
      'LATENCY_BENCH_READ_ITERATIONS',
      DEFAULT_CONFIG.readIterations,
    ),
    readConcurrency: parsePositiveInteger(
      'LATENCY_BENCH_READ_CONCURRENCY',
      DEFAULT_CONFIG.readConcurrency,
    ),
    writeIterations: parsePositiveInteger(
      'LATENCY_BENCH_WRITE_ITERATIONS',
      DEFAULT_CONFIG.writeIterations,
    ),
    writeConcurrency: parsePositiveInteger(
      'LATENCY_BENCH_WRITE_CONCURRENCY',
      DEFAULT_CONFIG.writeConcurrency,
    ),
    thresholdMs: parseNonNegativeNumber('LATENCY_BENCH_THRESHOLD', DEFAULT_CONFIG.thresholdMs),
    artifactPath,
    artifactRelative: path.isAbsolute(artifactRelative)
      ? path.relative(repoRoot, artifactRelative) || path.basename(artifactRelative)
      : artifactRelative,
    httpMetricsPath,
    httpMetricsRelative: path.isAbsolute(httpMetricsRelative)
      ? path.relative(repoRoot, httpMetricsRelative) || path.basename(httpMetricsRelative)
      : httpMetricsRelative,
  };
}

/**
 * Guarantees the artifact directory exists before attempting to write the JSON payload.
 */
function ensureArtifactDir(artifactPath: string): void {
  const dir = path.dirname(artifactPath);
  mkdirSync(dir, { recursive: true });
}

/**
 * Normalizes unknown error shapes into readable strings for inclusion in artifacts and console logs.
 */
function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === 'string') {
    return error.message;
  }
  if (error && typeof (error as { message?: unknown }).message === 'string') {
    return String((error as { message?: unknown }).message);
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Persists the summarized benchmark output to disk, including a truncated sample of any captured errors.
 */
function writeArtifact(
  results: ScenarioSummary[],
  thresholdMs: number,
  artifactPath: string,
  rawResults: ScenarioResult[],
): void {
  ensureArtifactDir(artifactPath);
  const payload = {
    generatedAt: new Date().toISOString(),
    thresholdMs,
    scenarios: results.map((summary, index) => ({
      name: summary.name,
      count: summary.count,
      concurrency: summary.concurrency,
      p50: summary.p50,
      p95: summary.p95,
      errorCount: summary.errorCount,
      errors: rawResults[index]?.errors.slice(0, 5).map((entry) => ({
        index: entry.index,
        message: normalizeErrorMessage(entry.error),
      })),
    })),
  };
  writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8' });
}

function recordStatus(collector: Map<number, number>, status: number): void {
  const current = collector.get(status) ?? 0;
  collector.set(status, current + 1);
}

function writeHttpMetrics(collector: Map<number, number>, outputPath: string): void {
  ensureArtifactDir(outputPath);
  const metrics = Array.from(collector.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => a.status - b.status);
  const payload = {
    generatedAt: new Date().toISOString(),
    metrics,
  };
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8' });
}

/**
 * Bootstraps the API app in-memory and runs the configured benchmark scenarios.
 */
async function main(): Promise<void> {
  const benchConfig = loadBenchConfig();
  const baseConfig = loadConfigFromEnv();
  const config = { ...baseConfig, rateLimitMax: 1000 };
  const repository = new InMemoryPostsRepository();
  const app = createApp(config, repository);

  const userId = 'bench-user';
  const role = 'owner';
  const sessionCookie = createSessionCookie(userId, role);
  const csrfToken = createCsrfToken(userId);
  const baseHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Cookie: `${sessionCookie}; csrf=${csrfToken}`,
    'X-CSRF-Token': csrfToken,
    'X-User-Id': userId,
    'X-User-Role': role,
    Origin: 'http://localhost:3000',
  } as const;

  const statusCounts = new Map<number, number>();

  const readScenario = await runScenario(
    'GET /posts',
    benchConfig.readIterations,
    benchConfig.readConcurrency,
    async () => {
      const response = await request(app).get('/posts').set('Accept', 'application/json');
      recordStatus(statusCounts, response.status);
      assertStatus(response, 200, 'GET /posts');
    },
  );

  const writeScenario = await runScenario(
    'POST /posts',
    benchConfig.writeIterations,
    benchConfig.writeConcurrency,
    async (index) => {
      const response = await request(app)
        .post('/posts')
        .set(baseHeaders)
        .send({
          title: `Bench Post ${index}`,
          content: `Bench content ${index}`,
        });
      recordStatus(statusCounts, response.status);
      assertStatus(response, 201, 'POST /posts');
    },
  );

  const rawResults = [readScenario, writeScenario];
  const summaries = rawResults.map(toSummary);
  appendSummary(
    summaries,
    benchConfig.thresholdMs,
    benchConfig.artifactRelative,
    benchConfig.httpMetricsRelative,
  );
  writeArtifact(summaries, benchConfig.thresholdMs, benchConfig.artifactPath, rawResults);
  writeHttpMetrics(statusCounts, benchConfig.httpMetricsPath);

  summaries.forEach((summary, index) => {
    const raw = rawResults[index];
    if (summary.p95 > benchConfig.thresholdMs) {
      console.warn(
        `⚠️ ${summary.name} p95=${summary.p95.toFixed(2)}ms exceeds ${benchConfig.thresholdMs}ms threshold`,
      );
    }
    if (summary.errorCount > 0) {
      console.warn(`⚠️ ${summary.name} encountered ${summary.errorCount} error(s)`);
      for (const entry of raw.errors.slice(0, 3)) {
        console.warn(`  - [${entry.index}] ${normalizeErrorMessage(entry.error)}`);
      }
    }
  });
}

main().catch((error) => {
  console.error('Latency bench failed', error);
  process.exitCode = 1;
});
