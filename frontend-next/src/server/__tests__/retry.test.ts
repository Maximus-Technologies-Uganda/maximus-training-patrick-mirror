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
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValueOnce("success");

    const promise = retryWithBackoff(fn, { maxAttempts: 3 });
    jest.runAllTimers();
    const result = await promise;

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw after max attempts exceeded", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));
    const promise = retryWithBackoff(fn, { maxAttempts: 2 });
    jest.runAllTimers();

    await expect(promise).rejects.toThrow("always fails");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw when total budget exceeded", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("failed"));
    const promise = retryWithBackoff(fn, {
      maxAttempts: 10,
      totalBudgetMs: 100,
      minDelayMs: 50,
      maxDelayMs: 60,
    });

    jest.runAllTimers();

    await expect(promise).rejects.toThrow("budget exhausted");
  });

  it("should use exponential backoff delays", async () => {
    const delays: number[] = [];
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail1"))
      .mockRejectedValueOnce(new Error("fail2"))
      .mockResolvedValueOnce("success");

    vi.spyOn(global, "setTimeout").mockImplementation((callback, delay) => {
      delays.push(delay as number);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return setTimeout(callback, 0) as any;
    });

    const promise = retryWithBackoff(fn, {
      maxAttempts: 3,
      minDelayMs: 100,
      maxDelayMs: 600,
    });

    jest.runAllTimers();
    await promise;

    // Delays should be within exponential bounds
    expect(delays.length).toBe(2);
    expect(delays[0]).toBeGreaterThanOrEqual(100);
    expect(delays[0]).toBeLessThanOrEqual(600);
    expect(delays[1]).toBeGreaterThanOrEqual(300);
    expect(delays[1]).toBeLessThanOrEqual(1200);
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
