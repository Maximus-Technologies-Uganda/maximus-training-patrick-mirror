import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxInject: 'import React from "react"'
  },
  test: {
    include: [
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      "tests/**/*.test.{ts,tsx}",
      "tests/**/*.spec.{ts,tsx}",
    ],
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    environmentMatchGlobs: [["tests/openapi.validation.test.ts", "node"]],
    exclude: [
      "node_modules/**",
      // Exclude Playwright specs from Vitest collection
      "tests/playwright/**",
      "tests/**/*.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/app/**/*.{ts,tsx}",
        "src/server/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}"
      ],
      exclude: [
        "src/tests/**",
        "tests/**",
        "**/*.d.ts"
      ]
    },
  },
});
