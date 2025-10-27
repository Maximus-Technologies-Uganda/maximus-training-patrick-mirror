const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  // Repo-wide ignores (ESLint v9 flat config)
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/out/**",
      "**/.turbo/**",
      "assets/**",
    ],
  },

  // Base JS everywhere (non-React)
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      ...js.configs.recommended.rules,
      // In flat config, we avoid an external globals package; rely on per-env disables
      "no-undef": "off",
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // Base TS everywhere
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-function": ["error", { allow: ["arrowFunctions", "functions", "methods"] }],
    },
  },

  // React rules scoped to frontend-next (TS)
  {
    files: ["frontend-next/**/*.{ts,tsx}"],
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },

  // React rules scoped to frontend-next (JS)
  {
    files: ["frontend-next/**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },

  // Jest test env (node + browser where applicable)
  {
    files: [
      "**/*.{test,spec}.{js,jsx,ts,tsx}",
      "**/tests/**/*.{js,jsx,ts,tsx}",
    ],
    rules: { "no-undef": "off" },
  },

  // Vitest test env for frontend (C3)
  {
    files: [
      "frontend/**/*.{test,spec}.{js,ts,tsx}",
      "frontend/tests/**/*.{js,ts,tsx}",
      "frontend/src/test-setup.js",
    ],
    rules: { "no-undef": "off" },
  },

  // Relax strict TS rules in api/** for adoption (C5)
  {
    files: ["api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Enforce no-console in API TypeScript (allow warn/error); audit logger gets a specific override below
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // Allow console usage only in the structured audit logger
  {
    files: ["api/src/logging/audit.ts"],
    rules: {
      "no-console": "off",
    },
  },

  // Allow console usage in API test files (helpers often stub/spy console)
  {
    files: [
      "api/tests/**/*.{ts,tsx}",
      "api/**/*.{test,spec}.{ts,tsx}",
    ],
    rules: {
      "no-console": "off",
    },
  },

  // Legacy workspaces use relaxed linting until modernized
  {
    files: [
      "frontend/**",
      "quote/**",
      "todo/**",
      "expense/**",
      "stopwatch/**",
      "repos/**",
    ],
    rules: {
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },

  // Generated Next.js ambient types should keep triple-slash references
  {
    files: ["frontend-next/next-env.d.ts"],
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },

  // Prettier config intentionally omitted in CI to avoid module resolution issues
];


