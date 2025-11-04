/**
 * Tailwind CSS Configuration
 *
 * Extends the default Tailwind theme with design system tokens.
 * All color, spacing, and radius values use CSS variables defined in src/styles/tokens.css
 *
 * This approach enables:
 * - Consistency across all components
 * - Easy token updates without changing component code
 * - Runtime theming support (dark mode, user preferences)
 * - Figma token synchronization
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Colors - mapped to CSS variables in tokens.css */
        primary: "var(--color-primary)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        error: "var(--color-error, #dc2626)",
        success: "var(--color-success, #16a34a)",
        warning: "var(--color-warning, #ea8900)",
        info: "var(--color-info, #0284c7)",
      },
      spacing: {
        /* Spacing - mapped to CSS variables in tokens.css */
        "1": "var(--space-1)",
        "2": "var(--space-2)",
        "3": "var(--space-3)",
        "4": "var(--space-4)",
      },
      borderRadius: {
        /* Border Radius - mapped to CSS variables in tokens.css */
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
  plugins: [],
};

export default config;
