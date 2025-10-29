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
      "no-console": ["error", { allow: ["warn", "error"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.object.name='console'][callee.property.name='log']",
          message: "console.log() is forbidden. Use console.warn() or console.error() instead, or route through logger."
        }
      ]
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
    rules: {
      // Allow test fixtures with sensitive keywords
      "no-restricted-syntax": "off",
      "no-console": "off"
    },
  },
];
