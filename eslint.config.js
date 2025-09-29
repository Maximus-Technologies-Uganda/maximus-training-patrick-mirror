/* eslint-disable no-undef */
const js = require("@eslint/js");
const globals = require("globals");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const prettierConfig = require("eslint-config-prettier");

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
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // Base TS everywhere
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      // TS handles types; avoid false positives for ambient types
      "no-undef": "off",
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
    languageOptions: {
      globals: { ...globals.jest, ...globals.node, ...globals.browser },
    },
    rules: { "no-undef": "off" },
  },

  // Vitest test env for frontend (C3)
  {
    files: [
      "frontend/**/*.{test,spec}.{js,ts,tsx}",
      "frontend/tests/**/*.{js,ts,tsx}",
      "frontend/src/test-setup.js",
    ],
    languageOptions: {
      globals: { ...globals.vitest, ...globals.node, ...globals.browser },
    },
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
      "no-console": "off",
    },
  },

  // Keep Prettier last to disable formatting-conflict rules
  prettierConfig,
];


