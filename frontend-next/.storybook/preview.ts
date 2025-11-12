import type { Preview } from "@storybook/react";
import * as React from "react";

/**
 * Storybook Preview Configuration
 * Configures global decorators and settings for all stories
 */

const preview: Preview = {
  parameters: {
    layout: "centered",
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: "color-contrast",
            enabled: true,
          },
          {
            id: "valid-aria-role",
            enabled: true,
          },
        ],
      },
      options: {
        check: {
          /**
           * Disable specific rules if needed
           * Use axe-core rule IDs
           */
          disable: [],
        },
      },
    },
  },
  decorators: [
    (Story) =>
      React.createElement(
        "div",
        { style: { fontFamily: "system-ui, -apple-system, sans-serif" } },
        React.createElement(Story)
      ),
  ],
};

export default preview;
