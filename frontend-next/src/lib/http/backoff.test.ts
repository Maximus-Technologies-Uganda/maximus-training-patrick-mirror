import { describe, expect, it, vi } from "vitest";

import { with429Backoff } from "./backoff";

function buildResponse(status: number, headers?: Record<string, string>): Response {
  return new Response(null, { status, headers });
}

describe("with429Backoff", () => {
  it("resolves immediately when the first response is not 429", async () => {
    const op = vi.fn(async () => buildResponse(200));
    const res = await with429Backoff(op);
    expect(res.status).toBe(200);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it("retries with Retry-After seconds header", async () => {
    const calls: number[] = [];
    const sleepCalls: number[] = [];
    const op = vi.fn(async () => {
      calls.push(Date.now());
      if (calls.length === 1) {
        return buildResponse(429, { "Retry-After": "1", "X-RateLimit-Limit": "10", "X-RateLimit-Remaining": "0" });
      }
      return buildResponse(200);
    });

    const res = await with429Backoff(op, {
      random: () => 0.5,
      sleepFn: async (ms: number) => {
        sleepCalls.push(ms);
      },
      onRetry: (info: { retryAfterMs: number; limit?: number; remaining?: number }) => {
        expect(info.retryAfterMs).toBe(1000);
        expect(info.limit).toBe(10);
        expect(info.remaining).toBe(0);
      },
    });

    expect(res.status).toBe(200);
    expect(op).toHaveBeenCalledTimes(2);
    expect(sleepCalls).toEqual([1000]);
  });

  it("uses HTTP-date Retry-After values", async () => {
    const future = new Date(Date.now() + 1500);
    const op = vi
      .fn()
      .mockResolvedValueOnce(buildResponse(429, { "Retry-After": future.toUTCString() }))
      .mockResolvedValueOnce(buildResponse(200));

    const delays: number[] = [];
    await with429Backoff(op, {
      random: () => 0.3,
      sleepFn: async (ms: number) => {
        delays.push(ms);
      },
    });

    expect(delays.length).toBe(1);
    expect(delays[0]).toBeGreaterThanOrEqual(0);
    expect(delays[0]).toBeLessThanOrEqual(1500);
  });

  it("falls back to exponential backoff when Retry-After is absent", async () => {
    const op = vi
      .fn()
      .mockResolvedValueOnce(buildResponse(429))
      .mockResolvedValueOnce(buildResponse(429))
      .mockResolvedValueOnce(buildResponse(200));

    const delays: number[] = [];
    await with429Backoff(op, {
      baseDelayMs: 200,
      jitterRatio: 0,
      sleepFn: async (ms: number) => {
        delays.push(ms);
      },
    });

    expect(delays).toEqual([200, 400]);
  });

  it("caps retries at the provided maximum and returns the last 429", async () => {
    const finalResponse = buildResponse(429);
    const op = vi
      .fn()
      .mockResolvedValueOnce(buildResponse(429))
      .mockResolvedValueOnce(finalResponse);
    const res = await with429Backoff(op, {
      maxAttempts: 2,
      sleepFn: async () => {
        // no-op
      },
    });

    expect(res).toBe(finalResponse);
    expect(res.status).toBe(429);
    expect(op).toHaveBeenCalledTimes(2);
  });

  it("aborts when the provided signal is cancelled", async () => {
    const controller = new AbortController();
    const op = vi
      .fn()
      .mockResolvedValueOnce(buildResponse(429))
      .mockImplementationOnce(async () => {
        throw new Error("Should not be called after abort");
      });

    const promise = with429Backoff(op, {
      sleepFn: async (_ms: number, signal?: AbortSignal) => {
        controller.abort();
        if (signal?.aborted) {
          throw signal.reason instanceof Error ? signal.reason : new Error("Aborted");
        }
      },
      signal: controller.signal,
    });

    await expect(promise).rejects.toThrow(/Aborted/);
    expect(op).toHaveBeenCalledTimes(1);
  });
});
