import type { StorybookConfig } from "@storybook/nextjs";

/**
 * Storybook Configuration for Frontend Foundations Week 10
 * - Enables a11y addon for accessibility audit
 * - Configured for Next.js App Router
 * - TypeScript support enabled
 */

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.ts",
    "../components/**/*.stories.tsx",
    "../src/**/*.stories.ts",
    "../src/**/*.stories.tsx",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y", // Accessibility audit addon
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesAsTypes: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  webpackFinal: async (config) => {
    return config;
  },
};

export default config;
