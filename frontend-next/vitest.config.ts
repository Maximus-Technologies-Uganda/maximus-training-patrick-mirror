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
      // Only include explicit Vitest tests from tests/; avoid Playwright specs
      "tests/**/*.test.{ts,tsx}",
      "tests/contract.*.spec.ts",
    ],
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    environmentMatchGlobs: [
      ["tests/openapi.validation.test.ts", "node"],
      ["src/app/api/**", "node"],
      ["src/app/**/__tests__/**", "node"]
    ],
    exclude: [
      "node_modules/**",
      // Exclude Playwright specs from Vitest collection
      "tests/playwright/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["json-summary", "lcov", "html"],
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
