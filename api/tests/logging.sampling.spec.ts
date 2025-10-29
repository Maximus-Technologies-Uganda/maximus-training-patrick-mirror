import { afterEach, describe, expect, it, jest } from "@jest/globals";

const ORIGINAL_ENV = process.env.NODE_ENV;
const ORIGINAL_SAMPLE_RATE = process.env.LOG_SAMPLE_RATE_INFO;

async function importSampling() {
  return import("../src/logging/sampling");
}

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV;
  if (typeof ORIGINAL_SAMPLE_RATE === "undefined") {
    delete process.env.LOG_SAMPLE_RATE_INFO;
  } else {
    process.env.LOG_SAMPLE_RATE_INFO = ORIGINAL_SAMPLE_RATE;
  }
  jest.resetModules();
});

describe("log sampling", () => {
  it("always emits error logs regardless of sampling config", async () => {
    jest.resetModules();
    const { shouldLog } = await importSampling();
    expect(shouldLog("error", { config: { infoSampleRate: 0, environment: "production" } })).toBe(true);
  });

  it("always emits audit logs regardless of sampling config", async () => {
    jest.resetModules();
    const { shouldLog } = await importSampling();
    expect(shouldLog("audit", { config: { infoSampleRate: 0.01, environment: "production" } })).toBe(true);
  });

  it("samples info logs in production using LOG_SAMPLE_RATE_INFO", async () => {
    jest.resetModules();
    const { shouldLog } = await importSampling();
    const samples = [0.1, 0.35, 0.5, 0.75, 0.99];
    let call = 0;
    const results = samples.map(() =>
      shouldLog("info", {
        config: { infoSampleRate: 0.4, environment: "production" },
        random: () => samples[call++]!,
      }),
    );
    expect(results).toEqual([true, true, false, false, false]);
  });

  it("always logs info entries when not in production", async () => {
    jest.resetModules();
    const { shouldLog } = await importSampling();
    expect(shouldLog("info", { config: { infoSampleRate: 0, environment: "development" }, random: () => 0.99 })).toBe(true);
  });

  it("always logs info entries when the sample rate is 1", async () => {
    jest.resetModules();
    const { shouldLog } = await importSampling();
    expect(shouldLog("info", { config: { infoSampleRate: 1, environment: "production" }, random: () => 0.99 })).toBe(true);
  });

  it("throws when LOG_SAMPLE_RATE_INFO is set outside production", async () => {
    process.env.NODE_ENV = "development";
    process.env.LOG_SAMPLE_RATE_INFO = "0.25";
    jest.resetModules();
    await expect(importSampling()).rejects.toThrow(/LOG_SAMPLE_RATE_INFO is only supported/);
  });
});
