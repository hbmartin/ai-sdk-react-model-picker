import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config([
  globalIgnores([
    'dist/**',
    'build/**', 
    'node_modules/**',
    'coverage/**',
    '*.config.js',
    '*.config.ts',
    'vite.config.ts',
    'postcss.config.js', 
    'tailwind.config.js',
    '.github/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      eslintPluginUnicorn.configs.recommended,
      eslintPluginPrettierRecommended,
    ],
    plugins: {
      'unused-imports': unusedImports,
      'import': importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // === UNUSED IMPORTS DETECTION ===
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      
      // === TypeScript CONSISTENT IMPORTS ===
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      
      // === IMPORT ORGANIZATION ===
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external', 
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          'newlines-between': 'never',
          pathGroups: [
            {
              pattern: 'react',
              group: 'builtin',
              position: 'before',
            },
            {
              pattern: '@ai-sdk/**',
              group: 'external',
              position: 'after',
            },
            {
              pattern: 'ai',
              group: 'external', 
              position: 'after',
            },
            {
              pattern: '../types',
              group: 'parent',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': ['error', { 'prefer-inline': false }],
      'import/no-unresolved': 'error',
      
      // === DISABLE CONFLICTING RULES ===
      '@typescript-eslint/no-unused-vars': 'off', // Use unused-imports plugin
      'no-unused-vars': 'off', // Use unused-imports plugin
      
      // === UNICORN OVERRIDES ===
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-export-from': 'off',
      
      // === CODE QUALITY ===
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // Test files - more relaxed rules
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'unicorn/consistent-function-scoping': 'off',
    },
  },
  {
    // Config files - disable some rules
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'unicorn/prefer-module': 'off',
      'import/no-default-export': 'off',
    },
  },
])
