// @ts-check

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([{
  files: [
    "**/src/**/*.{ts,tsx}"
  ],

  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
  ],

  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },

  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-require-imports": "off",
  },
}]);
