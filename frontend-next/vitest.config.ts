import path from "path";
import { defineConfig } from "vitest/config";

// Ensure Vitest resolves to the workspace's React and React DOM so the test
// runtime uses a single shared React instance (avoids invalid hook calls).
export default defineConfig({
  resolve: {
    // Use an array of alias entries so we can apply regex-based replacements
    // which Vite's resolver understands. This ensures imports that include
    // nested paths (for example: @testing-library/react/node_modules/react/...)
    // are redirected to the hoisted monorepo copies.
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // Specific aliases for the jsx runtime must come before the generic
      // 'react' alias so imports like 'react/jsx-dev-runtime' are resolved to
      // the shim file directly instead of being rewritten by the 'react'
      // alias (which would append '/jsx-dev-runtime' to the shim path).
      {
        find: "react/jsx-runtime",
        replacement: path.resolve(__dirname, "src", "test", "react-jsx-runtime-shim.cjs"),
      },
      {
        find: "react/jsx-dev-runtime",
        replacement: path.resolve(__dirname, "src", "test", "react-jsx-runtime-shim.cjs"),
      },
      // Point 'react' to the shim that normalizes interop and default exports.
      { find: "react", replacement: path.resolve(__dirname, "src", "test", "react-shim.cjs") },
      { find: "react-dom", replacement: path.resolve(__dirname, "..", "node_modules", "react-dom") },
      {
        find: "@testing-library/react",
        replacement: path.resolve(__dirname, "src", "test", "testing-library-shim.cjs"),
      },
      // Absolute-path aliases for nested copies that appear under the
      // monorepo root node_modules (pnpm sometimes hoists the package but
      // still leaves a nested node_modules inside it). These redirect any
      // absolute import that points to the nested react/react-dom folders
      // to the hoisted workspace copies.
      {
        find: path.resolve(
          __dirname,
          "..",
          "node_modules",
          "@testing-library",
          "react",
          "node_modules",
          "react",
        ),
        replacement: path.resolve(__dirname, "..", "node_modules", "react"),
      },
      {
        find: path.resolve(
          __dirname,
          "..",
          "node_modules",
          "@testing-library",
          "react",
          "node_modules",
          "react-dom",
        ),
        replacement: path.resolve(__dirname, "..", "node_modules", "react-dom"),
      },
      // Regex: redirect any nested @testing-library/react/node_modules/react/* to hoisted react
      {
        find: /@testing-library\/react\/node_modules\/react(\/.*)?$/,
        replacement: path.resolve(__dirname, "..", "node_modules", "react") + "$1",
      },
      // Regex: redirect any nested @testing-library/react/node_modules/react-dom/* to hoisted react-dom
      {
        find: /@testing-library\/react\/node_modules\/react-dom(\/.*)?$/,
        replacement: path.resolve(__dirname, "..", "node_modules", "react-dom") + "$1",
      },
      // Also remap nested jsx-runtime imports under testing-library to hoisted react's jsx-runtime
      {
        find: /@testing-library\/react\/node_modules\/react\/jsx-runtime(\/.*)?$/,
        replacement:
          path.resolve(__dirname, "..", "node_modules", "react", "jsx-runtime.js") + "$1",
      },
      {
        find: /@testing-library\/react\/node_modules\/react\/jsx-dev-runtime(\/.*)?$/,
        replacement: path.resolve(__dirname, "src", "test", "react-jsx-runtime-shim.cjs") + "$1",
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  esbuild: {
    jsx: "automatic",
    jsxInject: 'import React from "react"',
  },
  
  optimizeDeps: {
    // Ensure these testing and runtime libs are pre-bundled by Vite so the
    // runtime doesn't load nested React or React DOM from their own package
    // folders. This helps avoid duplicate-React instances during Vitest runs.
    include: ["@testing-library/react", "@testing-library/jest-dom", "swr", "react", "react-dom"],
    exclude: ["firebase/app", "firebase/auth"],
  },
  ssr: {
    external: ["firebase/app", "firebase/auth"],
  },
  test: {
    include: [
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      // Only include explicit Vitest tests from tests/; avoid Playwright specs
      "tests/**/*.test.{ts,tsx}",
      "tests/**/*.spec.{ts,tsx}",
      "tests/contract.*.spec.ts",
    ],
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    // Inline @testing-library/react so Vitest pre-bundles it together with the
    // workspace's React. This avoids the test runtime loading a nested
    // copy of react/react-dom from @testing-library's own node_modules which
    // causes the "Invalid hook call" errors.
    // Use server.deps.inline for vite-node (Vitest) to inline these deps
    // during server-side test runs. This prebundles them with the workspace
    // React/React DOM and prevents nested package copies from being loaded.
    deps: {
      // Inline these dependencies for vite-node (Vitest). This forces
      // Vite to pre-bundle them with the workspace's React/React DOM so
      // nested copies are not used at runtime.
      inline: ["@testing-library/react", "@testing-library/jest-dom", "swr", "react", "react-dom"],
    },
    server: {
      deps: {
        inline: ["@testing-library/react", "@testing-library/jest-dom", "swr", "react", "react-dom"],
      },
    },
    environmentMatchGlobs: [
      ["tests/openapi.validation.test.ts", "node"],
      ["src/app/api/**", "node"],
      ["src/app/**/__tests__/**", "node"],
    ],
    exclude: [
      "node_modules/**",
      // Exclude Playwright specs from Vitest collection
      "tests/playwright/**",
      // Exclude e2e/a11y Playwright test files (*.spec.ts that are NOT contract tests)
      "tests/auth.spec.ts",
      "tests/a11y.*.spec.ts",
      "tests/core-flows.spec.ts",
      "tests/observability.spec.ts",
      "tests/a11y.keyboard.spec.ts",
      "tests/cookie.samesite.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["json-summary", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["src/app/**/*.{ts,tsx}", "src/server/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
      exclude: ["src/tests/**", "tests/**", "**/*.d.ts"],
    },
  },
});
