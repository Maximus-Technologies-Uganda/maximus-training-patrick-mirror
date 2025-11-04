import { createOfflineFont, type OfflineFontDefinition } from "./offline-font";

interface RemoteFontDefinition {
  readonly className: string;
  readonly variable: string;
}

export interface LoadedFonts {
  readonly sans: OfflineFontDefinition | RemoteFontDefinition;
  readonly mono: OfflineFontDefinition | RemoteFontDefinition;
  readonly styles?: string;
}

const SANS_VARIABLE = "--font-geist-sans" as const;
const MONO_VARIABLE = "--font-geist-mono" as const;

const SANS_FALLBACK: readonly string[] = [
  "ui-sans-serif",
  "system-ui",
  "-apple-system",
  "Segoe UI",
  "Helvetica Neue",
  "Helvetica",
  "Arial",
  "Noto Sans",
  "sans-serif",
];

const MONO_FALLBACK: readonly string[] = [
  "ui-monospace",
  "SFMono-Regular",
  "Menlo",
  "Monaco",
  "Consolas",
  "Liberation Mono",
  "Courier New",
  "monospace",
];

const truthy = new Set(["1", "true", "yes", "on"]);

const shouldUseOfflineFonts = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  return truthy.has(value.trim().toLowerCase());
};

const remoteSans: RemoteFontDefinition = {
  className: "font-geist-sans",
  variable: "font-geist-sans",
};

const remoteMono: RemoteFontDefinition = {
  className: "font-geist-mono",
  variable: "font-geist-mono",
};

const offlineOnly = shouldUseOfflineFonts(process.env.NEXT_DISABLE_REMOTE_FONTS);

const createRemoteFonts = (): LoadedFonts => ({
  sans: remoteSans,
  mono: remoteMono,
});

const createOfflineFonts = (): LoadedFonts => {
  const sans = createOfflineFont({
    variable: SANS_VARIABLE,
    fallback: SANS_FALLBACK,
  });
  const mono = createOfflineFont({
    variable: MONO_VARIABLE,
    fallback: MONO_FALLBACK,
  });

  return {
    sans: sans.font,
    mono: mono.font,
    styles: `${sans.styles}\n${mono.styles}`,
  };
};

/**
 * Loads Geist Sans and Mono font definitions.
 *
 * When remote fonts are allowed we return CSS class stubs that map to the fallback
 * stacks defined in {@link frontend-next/src/app/globals.css}. Offline mode injects
 * inline styles so the classes continue to resolve without network access.
 *
 * @returns {LoadedFonts} CSS variable-aware font descriptors used by the app shell.
 * @example
 * const fonts = loadFonts();
 * <body className={fonts.sans.variable}>
 */
export const loadFonts = (): LoadedFonts => {
  if (offlineOnly) {
    return createOfflineFonts();
  }
  return createRemoteFonts();
};
