import { afterEach, describe, expect, it, vi } from "vitest";

import { createOfflineFont } from "./offline-font";

const originalEnv = process.env.NEXT_DISABLE_REMOTE_FONTS;

afterEach(() => {
  process.env.NEXT_DISABLE_REMOTE_FONTS = originalEnv;
  vi.resetModules();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("loadFonts", () => {
  it("uses remote font class stubs when offline mode is disabled", async () => {
    const { loadFonts } = await import("./fonts");
    const fonts = loadFonts();

    expect(fonts.styles).toBeUndefined();
    expect(fonts.sans.className).toBe("font-geist-sans");
    expect(fonts.mono.className).toBe("font-geist-mono");
  });

  it("falls back to offline font declarations when remote fonts are disabled", async () => {
    process.env.NEXT_DISABLE_REMOTE_FONTS = "1";

    const { loadFonts } = await import("./fonts");
    const fonts = loadFonts();

    expect(fonts.styles).toContain("--font-geist-sans");
    expect(fonts.styles).toContain("--font-geist-mono");
    expect(fonts.sans.className).toContain("offline-font");
    expect(fonts.mono.className).toContain("offline-font");
  });
});

describe("createOfflineFont", () => {
  it("throws when the fallback stack is empty", () => {
    expect(() =>
      createOfflineFont({
        variable: "--font-invalid",
        fallback: [],
      })
    ).toThrow("Fallback font stack must include at least one entry.");
  });

  it("creates deterministic class names from CSS variables", () => {
    const result = createOfflineFont({
      variable: "--font-custom",
      fallback: ["system-ui"],
    });

    expect(result.font.className).toBe("offline-font-font-custom");
    expect(result.styles).toContain("--font-custom: system-ui");
  });

  it("quotes fallback entries that contain whitespace", () => {
    const result = createOfflineFont({
      variable: "--font-whitespace",
      fallback: ["Segoe UI", "sans-serif"],
    });

    expect(result.styles).toContain('"Segoe UI"');
    expect(result.styles).toContain("sans-serif");
  });
});
