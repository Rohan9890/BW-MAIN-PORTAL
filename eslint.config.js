import js from "@eslint/js";
import globals from "globals";

const isProduction =
  process.env.NODE_ENV === "production" || process.env.ESLINT_PROD === "true";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-console": isProduction
        ? ["error", { allow: ["warn", "error"] }]
        : ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];
