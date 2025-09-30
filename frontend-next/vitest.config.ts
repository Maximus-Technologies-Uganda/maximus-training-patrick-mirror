import { defineConfig } from "vitest/config";

export default defineConfig({
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
    exclude: ["node_modules/**", "tests/playwright/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
    },
  },
});
