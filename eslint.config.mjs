import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.es2022 } },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }
  },
  { files: ['tests/**/*.js'], languageOptions: { globals: globals.jest } },
  { files: ['public/**/*.js'], languageOptions: { globals: globals.browser } }
];
