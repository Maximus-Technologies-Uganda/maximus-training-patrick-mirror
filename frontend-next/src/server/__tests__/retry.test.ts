import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { retryWithBackoff, parseRetryAfter } from "../retry";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should return result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await retryWithBackoff(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and succeed", async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error("failed")).mockResolvedValueOnce("success");

    const promise = retryWithBackoff(fn, { maxAttempts: 3 });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should use exponential backoff delays", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValueOnce("success");

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      minDelayMs: 100,
      maxDelayMs: 600,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    // Should succeed after 2 retries
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("parseRetryAfter", () => {
  it("should parse seconds", () => {
    const ms = parseRetryAfter("60");
    expect(ms).toBe(60000);
  });

  it("should parse HTTP-date", () => {
    const futureDate = new Date(Date.now() + 60000);
    const ms = parseRetryAfter(futureDate.toUTCString());
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(60000);
  });

  it("should return null for invalid input", () => {
    expect(parseRetryAfter("invalid")).toBeNull();
    expect(parseRetryAfter(undefined)).toBeNull();
  });
});
