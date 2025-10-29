import { afterEach, describe, expect, it, vi } from "vitest";
import { retryWithIdempotencyBackoff } from "../src/lib/http/backoff";

afterEach(() => {
  vi.useRealTimers();
});

describe("idempotency retry helper", () => {
  it("rejects POST retries with a documentation pointer", async () => {
    await expect(
      retryWithIdempotencyBackoff(async () => Promise.resolve(), {
        method: "POST",
        maxAttempts: 2,
      }),
    ).rejects.toThrow(/POST requests are not idempotent/);
  });

  it("retries PUT with a stable idempotency key", async () => {
    vi.useFakeTimers();
    const attempts: Array<{ attempt: number; key?: string }> = [];

    const promise = retryWithIdempotencyBackoff(async (context) => {
      attempts.push({ attempt: context.attempt, key: context.idempotencyKey });
      if (context.attempt === 0) {
        throw new Error("transient");
      }
      return context.idempotencyKey ?? null;
    }, {
      method: "PUT",
      idempotencyKey: "abc-123",
      maxAttempts: 2,
      baseDelayMs: 1,
      random: () => 0,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("abc-123");
    expect(attempts).toEqual([
      { attempt: 0, key: "abc-123" },
      { attempt: 1, key: "abc-123" },
    ]);
  });

  it("requires an idempotency key when retrying PATCH", async () => {
    await expect(
      retryWithIdempotencyBackoff(async () => Promise.resolve("ok"), {
        method: "PATCH",
        maxAttempts: 1,
      }),
    ).rejects.toThrow(/Idempotency key is required/);
  });
});
