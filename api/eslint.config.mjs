import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.js"],
    ignores: ["**/*.ts", "node_modules/**", "dist/**"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
  {
    files: ["tests/**/*.js", "**/*.test.js", "**/*.spec.js", "**/*.int.test.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {},
  },
];
