/**
 * Utilities for log sampling controls. Production can downsample noisy `info`
 * logs without hiding security-relevant signals. Sampling is disabled in
 * non-production environments to preserve local visibility.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "audit";

export interface SamplingConfig {
  /** Sample rate applied to `info` level logs (0.0 – 1.0). */
  infoSampleRate: number;
  /** Current Node environment (typically `production` or `development`). */
  environment: string;
}

const DEFAULT_ENVIRONMENT = process.env.NODE_ENV ?? "development";
const RAW_INFO_SAMPLE_RATE = process.env.LOG_SAMPLE_RATE_INFO;

function normalizeSampleRate(raw: unknown, fallback: number): number {
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim().length > 0
        ? Number.parseFloat(raw)
        : Number.NaN;
  if (!Number.isFinite(value)) return fallback;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function assertSamplingEnvConstraints(env: string, rawSampleRate: unknown): void {
  if (env === "production") {
    return;
  }
  const value = typeof rawSampleRate === "string" ? rawSampleRate.trim() : "";
  if (value.length > 0) {
    throw new Error(
      "LOG_SAMPLE_RATE_INFO is only supported when NODE_ENV=production. Remove the variable in non-production environments.",
    );
  }
}

assertSamplingEnvConstraints(DEFAULT_ENVIRONMENT, RAW_INFO_SAMPLE_RATE);

const DEFAULT_INFO_SAMPLE_RATE = normalizeSampleRate(RAW_INFO_SAMPLE_RATE, 1);

export const defaultSamplingConfig: SamplingConfig = {
  infoSampleRate: DEFAULT_INFO_SAMPLE_RATE,
  environment: DEFAULT_ENVIRONMENT,
};

export interface ShouldLogOptions {
  /** Override configuration used for the decision (useful in tests). */
  config?: Partial<SamplingConfig>;
  /** RNG hook so tests can provide deterministic sampling behaviour. */
  random?: () => number;
}

function resolveConfig(overrides?: Partial<SamplingConfig>): SamplingConfig {
  return {
    infoSampleRate: normalizeSampleRate(overrides?.infoSampleRate, DEFAULT_INFO_SAMPLE_RATE),
    environment: overrides?.environment ?? DEFAULT_ENVIRONMENT,
  };
}

/**
 * Decide whether the caller should emit a log entry at the given level.
 *
 * - `error`, `warn`, and `audit` entries are always emitted.
 * - `info` entries respect `LOG_SAMPLE_RATE_INFO` when `NODE_ENV=production`.
 * - All other environments bypass sampling to aid development visibility.
 */
export function shouldLog(level: LogLevel, options?: ShouldLogOptions): boolean {
  const config = resolveConfig(options?.config);

  if (level === "error" || level === "warn" || level === "audit") {
    return true;
  }

  if (config.environment !== "production") {
    return true;
  }

  if (level !== "info") {
    return true;
  }

  if (config.infoSampleRate >= 1) {
    return true;
  }

  if (config.infoSampleRate <= 0) {
    return false;
  }

  const rng = options?.random ?? Math.random;
  const sample = rng();
  if (!Number.isFinite(sample)) return false;
  return sample < config.infoSampleRate;
}

export default shouldLog;
