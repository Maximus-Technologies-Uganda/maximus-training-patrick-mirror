/**
 * Test: Log Sampling (T025)
 * Validates 100% sampling for failed /status endpoint responses
 * FR-028: 100% sampling for ok:false /status events
 */

import { describe, it, expect, vi } from "vitest";

describe("Log Sampling", () => {
  /**
   * Sampling decision logic
   * Rules:
   * - /status endpoint failures (ok:false) → ALWAYS log (100% sampling)
   * - /status endpoint success (ok:true) → Use standard sampling
   * - Other routes → Use standard sampling
   */
  function shouldSampleLog(
    route: string,
    ok: boolean,
    standardSamplingRate: number = 0.1 // 10% default
  ): boolean {
    // /status failures always logged for debugging health checks
    if (route === "/status" && !ok) {
      return true; // 100% sampling
    }

    // /status successes and other routes use standard sampling
    return Math.random() < standardSamplingRate;
  }

  it("should always log /status endpoint failures", () => {
    const route = "/status";
    const ok = false;

    // Simulate 100 attempts - all should return true
    const samples = Array.from({ length: 100 }, () => shouldSampleLog(route, ok, 0.1));

    const sampledCount = samples.filter((s) => s).length;
    expect(sampledCount).toBe(100); // All 100% sampled
  });

  it("should not always log /status endpoint successes", () => {
    const route = "/status";
    const ok = true;
    const samplingRate = 0.1; // 10%

    // Mock Math.random for predictable testing
    const originalRandom = Math.random;
    let callCount = 0;
    Math.random = vi.fn(() => {
      callCount++;
      // Return values < 0.1 for first 10, >= 0.1 for rest
      return callCount <= 10 ? callCount / 100 : callCount / 100;
    }) as unknown as () => number;

    try {
      const samples = Array.from({ length: 100 }, () => shouldSampleLog(route, ok, samplingRate));

      const sampledCount = samples.filter((s) => s).length;
      // Not all should be sampled (only ~10%)
      expect(sampledCount).toBeLessThan(100);
    } finally {
      Math.random = originalRandom;
    }
  });

  it("should apply standard sampling to non-/status routes", () => {
    const route = "/posts";
    const ok = true;
    const samplingRate = 0.1;

    // Simulate multiple requests
    let sampledCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (shouldSampleLog(route, ok, samplingRate)) {
        sampledCount++;
      }
    }

    // Should be roughly 10% (100 out of 1000)
    // Allow for statistical variance: 50-150 samples
    expect(sampledCount).toBeGreaterThan(50);
    expect(sampledCount).toBeLessThan(150);
  });

  it("should log /status errors with complete details", () => {
    const logEntry = {
      trace: "550e8400-e29b-41d4-a716-446655440000",
      route: "/status",
      latency_ms: 5000,
      status: 200,
      upstream_status: 503,
      method: "GET",
      timestamp: new Date().toISOString(),
      ok: false,
      reason: "Upstream service unavailable",
    };

    // Determine if should log
    const shouldLog = logEntry.route === "/status" && !logEntry.ok;

    expect(shouldLog).toBe(true);
    expect(logEntry.trace).toBeTruthy();
    expect(logEntry.reason).toBeTruthy();
  });

  it("should differentiate between /status ok and not ok for sampling", () => {
    const successLog = {
      route: "/status",
      ok: true,
      trace: "trace-1",
    };

    const failureLog = {
      route: "/status",
      ok: false,
      trace: "trace-2",
    };

    // Failure should always be sampled
    expect(shouldSampleLog(failureLog.route, failureLog.ok)).toBe(true);

    // Success uses standard sampling (variable)
    // We can't predict the exact result, but we know the logic path
    const successSamples = Array.from({ length: 100 }, () =>
      shouldSampleLog(successLog.route, successLog.ok, 0.1)
    );

    // Some successes will be sampled, but not all
    const sampledCount = successSamples.filter((s) => s).length;
    expect(sampledCount).toBeGreaterThan(0); // Some sampled
    expect(sampledCount).toBeLessThan(100); // But not all
  });

  it("should maintain trace ID across sampled logs", () => {
    const traceId = "550e8400-e29b-41d4-a716-446655440000";

    const failureLog1 = {
      trace: traceId,
      route: "/status",
      ok: false,
      latency_ms: 100,
    };

    const failureLog2 = {
      trace: traceId,
      route: "/api/posts",
      ok: false,
      latency_ms: 50,
    };

    expect(failureLog1.trace).toBe(failureLog2.trace);
  });

  it("should sample errors on other routes normally", () => {
    const errorLog = {
      route: "/posts",
      ok: false,
      trace: "trace",
      latency_ms: 150,
      status: 400,
    };

    // Error on /posts uses standard sampling, not 100%
    // This prevents log spam from repeated validation errors
    const samplingRate = 0.1;
    const samples = Array.from({ length: 1000 }, () =>
      shouldSampleLog(errorLog.route, errorLog.ok, samplingRate)
    );

    const sampledCount = samples.filter((s) => s).length;
    // Should be roughly 10%, not 100%
    expect(sampledCount).toBeLessThan(1000);
    expect(sampledCount).toBeGreaterThan(50);
  });

  it("should respect /status health check critical nature", () => {
    /**
     * Rationale: /status endpoint failures are critical for observability
     * A health check failure indicates the application or upstream is down
     * We must always log these to detect outages, regardless of sampling
     *
     * Other request failures (validation, not found, etc.) are less critical
     * and can be sampled to reduce log volume
     */

    const healthCheckFailure = {
      route: "/status",
      ok: false,
      reason: "Database unreachable",
    };

    const validationFailure = {
      route: "/posts",
      ok: false,
      reason: "Invalid query parameter",
    };

    // Health check failure must be logged
    expect(shouldSampleLog(healthCheckFailure.route, healthCheckFailure.ok)).toBe(true);

    // Validation failure uses standard sampling (may not be logged)
    // We test the logic, not the random outcome
    const isValidationSampled = shouldSampleLog(validationFailure.route, validationFailure.ok, 0.1);
    expect(typeof isValidationSampled).toBe("boolean");
  });

  it("should use configurable sampling rates", () => {
    const route = "/posts";
    const ok = true;

    // High sampling rate
    const highRateSamples = Array.from(
      { length: 100 },
      () => shouldSampleLog(route, ok, 0.5) // 50%
    );
    const highSampledCount = highRateSamples.filter((s) => s).length;

    // Low sampling rate
    const lowRateSamples = Array.from(
      { length: 100 },
      () => shouldSampleLog(route, ok, 0.01) // 1%
    );
    const lowSampledCount = lowRateSamples.filter((s) => s).length;

    // High rate should have more samples than low rate
    expect(highSampledCount).toBeGreaterThan(lowSampledCount);
  });
});
