import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const metricSchema = z.object({
  status: z.coerce.number().int().min(100).max(599),
  count: z.coerce.number().int().min(0),
});

type HttpMetric = z.infer<typeof metricSchema>;

type AlertSummary = {
  total: number;
  fiveXx: number;
  fourTwoNine: number;
  fiveXxRate: number;
  fourTwoNineRate: number;
};

const FIVE_XX_THRESHOLD_COUNT = 0;
const FOUR_TWO_NINE_THRESHOLD_RATE = 5;

function candidatePaths(): string[] {
  const overrides: Array<string | undefined> = [process.env.ALERTING_STUB_SOURCE];
  return [
    ...overrides.filter((value): value is string => Boolean(value && value.trim().length > 0)),
    path.join(process.cwd(), 'gate', 'http-metrics.json'),
  ];
}

function extractMetrics(raw: unknown): HttpMetric[] {
  const direct = z.array(metricSchema).safeParse(raw);
  if (direct.success) {
    return direct.data;
  }
  const metricsProperty = z.object({ metrics: z.array(metricSchema) }).safeParse(raw);
  if (metricsProperty.success) {
    return metricsProperty.data.metrics;
  }
  const samplesProperty = z.object({ samples: z.array(metricSchema) }).safeParse(raw);
  if (samplesProperty.success) {
    return samplesProperty.data.samples;
  }
  const entriesProperty = z.object({ entries: z.array(metricSchema) }).safeParse(raw);
  if (entriesProperty.success) {
    return entriesProperty.data.entries;
  }
  return [];
}

function loadMetrics(): { metrics: HttpMetric[]; source?: string } {
  for (const candidate of candidatePaths()) {
    const resolved = path.resolve(candidate);
    if (!existsSync(resolved)) {
      continue;
    }
    try {
      const rawContent = readFileSync(resolved, 'utf8');
      const parsed: unknown = JSON.parse(rawContent);
      const metrics = extractMetrics(parsed);
      if (metrics.length > 0) {
        return { metrics, source: resolved };
      }
    } catch (error) {
      console.warn(
        `Unable to parse metrics from ${resolved}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return { metrics: [], source: undefined };
}

function computeSummary(metrics: HttpMetric[]): AlertSummary {
  const total = metrics.reduce((sum, metric) => sum + metric.count, 0);
  const fiveXx = metrics
    .filter((metric) => metric.status >= 500)
    .reduce((sum, metric) => sum + metric.count, 0);
  const fourTwoNine = metrics
    .filter((metric) => metric.status === 429)
    .reduce((sum, metric) => sum + metric.count, 0);
  const denominator = total === 0 ? 1 : total;
  return {
    total,
    fiveXx,
    fourTwoNine,
    fiveXxRate: (fiveXx / denominator) * 100,
    fourTwoNineRate: (fourTwoNine / denominator) * 100,
  };
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function determineStatus(
  count: number,
  rate: number,
): { fiveXxStatus: string; fourTwoNineStatus: string } {
  const fiveXxStatus = count > FIVE_XX_THRESHOLD_COUNT ? 'Investigate' : 'OK';
  const fourTwoNineStatus = rate > FOUR_TWO_NINE_THRESHOLD_RATE ? 'Investigate' : 'OK';
  return { fiveXxStatus, fourTwoNineStatus };
}

function buildSummaryLines(
  summary: AlertSummary,
  metrics: HttpMetric[],
  source?: string,
): string[] {
  const { fiveXxStatus, fourTwoNineStatus } = determineStatus(summary.fiveXx, summary.fiveXxRate);
  const lines = [
    '## Alerting Stub - HTTP status overview',
    '',
    '| Metric | Count | Rate | Threshold | Status |',
    '| --- | --- | --- | --- | --- |',
    `| 5xx responses | ${summary.fiveXx} | ${formatPercent(summary.fiveXxRate)} | > ${FIVE_XX_THRESHOLD_COUNT} count | ${fiveXxStatus} |`,
    `| 429 responses | ${summary.fourTwoNine} | ${formatPercent(summary.fourTwoNineRate)} | > ${FOUR_TWO_NINE_THRESHOLD_RATE}% rate | ${fourTwoNineStatus} |`,
    `| Total sampled | ${summary.total} | 100.00% | n/a | n/a |`,
    '',
    '### Status code distribution',
    '',
  ];

  const sorted = [...metrics].sort((a, b) => b.count - a.count);
  lines.push('| Status | Count |', '| --- | --- |');
  if (sorted.length === 0) {
    lines.push('| (no data) | 0 |');
  } else {
    sorted.forEach((metric) => {
      lines.push(`| ${metric.status} | ${metric.count} |`);
    });
  }

  lines.push(
    '',
    source ? `Source: ${source}` : 'Source: (no metrics file found; defaulting to zero counts)',
  );
  lines.push('Thresholds: 5xx unexpected (any count); 429 investigate when rate > 5%.');
  return lines;
}

function writeSummary(lines: string[]): void {
  const payload = `${lines.join('\n')}\n`;
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    appendFileSync(summaryFile, payload);
  }
  console.log(payload.trimEnd());
}

function main(): void {
  const { metrics, source } = loadMetrics();
  const summary = computeSummary(metrics);
  const lines = buildSummaryLines(summary, metrics, source);
  writeSummary(lines);

  if (summary.fiveXx > FIVE_XX_THRESHOLD_COUNT) {
    console.warn(`Detected ${summary.fiveXx} unexpected 5xx response(s) in sampled metrics.`);
  }
  if (summary.fourTwoNineRate > FOUR_TWO_NINE_THRESHOLD_RATE) {
    console.warn(
      `Rate limit responses exceed ${FOUR_TWO_NINE_THRESHOLD_RATE}% (${formatPercent(summary.fourTwoNineRate)} observed).`,
    );
  }
}

main();
