import { describe, expect, it } from "@jest/globals";
import { shouldLog } from "../src/logging/sampling";

describe("log sampling", () => {
  it("always emits error logs regardless of sampling config", () => {
    expect(shouldLog("error", { config: { infoSampleRate: 0, environment: "production" } })).toBe(true);
  });

  it("always emits audit logs regardless of sampling config", () => {
    expect(shouldLog("audit", { config: { infoSampleRate: 0.01, environment: "production" } })).toBe(true);
  });

  it("samples info logs in production using LOG_SAMPLE_RATE_INFO", () => {
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

  it("always logs info entries when not in production", () => {
    expect(shouldLog("info", { config: { infoSampleRate: 0, environment: "development" }, random: () => 0.99 })).toBe(true);
  });

  it("always logs info entries when the sample rate is 1", () => {
    expect(shouldLog("info", { config: { infoSampleRate: 1, environment: "production" }, random: () => 0.99 })).toBe(true);
  });
});
