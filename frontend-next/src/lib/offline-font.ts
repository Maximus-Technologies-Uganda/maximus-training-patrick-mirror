export interface OfflineFontDefinition {
  readonly className: string;
  readonly variable: string;
}

export interface OfflineFontResult {
  readonly font: OfflineFontDefinition;
  readonly styles: string;
}

export interface OfflineFontOptions {
  readonly variable: `--${string}`;
  readonly fallback: readonly string[];
}

const sanitizeVariable = (variable: `--${string}`): string => {
  const trimmed = variable.replace(/^--/, "");
  const normalized = trimmed
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  if (normalized.length === 0) {
    throw new Error(`Unable to derive offline font class from variable "${variable}".`);
  }
  return `offline-font-${normalized}`;
};

const toFontFamily = (fallback: readonly string[]): string => {
  if (fallback.length === 0) {
    throw new Error("Fallback font stack must include at least one entry.");
  }
  const formatFamily = (family: string): string => {
    const trimmed = family.trim();
    if (trimmed.length === 0) {
      return "";
    }
    if (/^['"].*['"]$/.test(trimmed)) {
      return trimmed;
    }
    if (/^[a-z0-9-]+$/i.test(trimmed)) {
      return trimmed;
    }
    const escaped = trimmed.replace(/"/g, '\\"');
    return `"${escaped}"`;
  };

  return fallback
    .map((family) => formatFamily(family))
    .filter((family) => family.length > 0)
    .join(", ");
};

export const createOfflineFont = ({
  variable,
  fallback,
}: OfflineFontOptions): OfflineFontResult => {
  const className = sanitizeVariable(variable);
  const fontFamily = toFontFamily(fallback);
  const declarations = `${variable}: ${fontFamily}; font-family: ${fontFamily};`;

  return {
    font: {
      className,
      variable: className,
    },
    styles: `.${className}{${declarations}}`,
  };
};
