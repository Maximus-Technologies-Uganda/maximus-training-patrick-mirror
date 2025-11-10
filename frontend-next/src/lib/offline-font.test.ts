import { describe, it, expect } from "vitest";
import { createOfflineFont } from "./offline-font";

describe("createOfflineFont", () => {
  it("creates font with valid variable and fallback", () => {
    const result = createOfflineFont({
      variable: "--font-inter",
      fallback: ["Arial", "sans-serif"],
    });

    expect(result.font.className).toBe("offline-font-font-inter");
    expect(result.font.variable).toBe("offline-font-font-inter");
    expect(result.styles).toContain("--font-inter:");
    expect(result.styles).toContain("font-family:");
  });

  it("handles single fallback font", () => {
    const result = createOfflineFont({
      variable: "--font-mono",
      fallback: ["Courier New"],
    });

    expect(result.font.className).toBe("offline-font-font-mono");
    expect(result.styles).toContain("Courier New");
  });

  it("sanitizes variable name correctly", () => {
    const result = createOfflineFont({
      variable: "--font-custom-name",
      fallback: ["Arial"],
    });

    expect(result.font.className).toBe("offline-font-font-custom-name");
  });

  it("handles fonts with quotes in fallback", () => {
    const result = createOfflineFont({
      variable: "--font-serif",
      fallback: ['"Times New Roman"', "serif"],
    });

    expect(result.styles).toContain('"Times New Roman"');
  });

  it("handles fonts with spaces in fallback", () => {
    const result = createOfflineFont({
      variable: "--font-sans",
      fallback: ["Helvetica Neue", "Arial"],
    });

    expect(result.styles).toContain('"Helvetica Neue"');
  });

  it("sanitizes special characters in variable", () => {
    const result = createOfflineFont({
      variable: "--font-test_123",
      fallback: ["Arial"],
    });

    expect(result.font.className).toBe("offline-font-font-test-123");
  });

  it("throws error for empty fallback array", () => {
    expect(() => {
      createOfflineFont({
        variable: "--font-test",
        fallback: [],
      });
    }).toThrow("Fallback font stack must include at least one entry");
  });

  it("handles multiple fallback fonts", () => {
    const result = createOfflineFont({
      variable: "--font-stack",
      fallback: ["Arial", "Helvetica", "sans-serif"],
    });

    expect(result.styles).toContain("Arial");
    expect(result.styles).toContain("Helvetica");
    expect(result.styles).toContain("sans-serif");
  });

  it("filters out empty strings in fallback", () => {
    const result = createOfflineFont({
      variable: "--font-test",
      fallback: ["Arial", "", "sans-serif"],
    });

    expect(result.styles).not.toContain('""');
    expect(result.styles).toContain("Arial");
    expect(result.styles).toContain("sans-serif");
  });
});
