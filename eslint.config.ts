import js from '@eslint/js';
import { type Config, defineConfig, globalIgnores } from 'eslint/config';
import codeComplete from 'eslint-plugin-code-complete';
import importX from 'eslint-plugin-import-x';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import { configs as tsConfigs } from 'typescript-eslint';
import type { ESLint } from 'eslint';

export default defineConfig([
  globalIgnores([
    'dist/**',
    'build/**',
    'node_modules/**',
    'coverage/**',
    'vite.config.ts',
    'postcss.config.js',
    'tailwind.config.js',
    'tailwind-preset.d.ts',
    'tailwind-preset.d.cts',
    '.github/**',
    'storybook-static',
    '.storybook',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tsConfigs.recommendedTypeChecked,
      ...tsConfigs.strictTypeChecked,
      reactRefresh.configs.vite,
      reactRefresh.configs.recommended,
      eslintPluginUnicorn.configs.all,
      eslintPluginPrettierRecommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      // sonarjs config objects are typed against a looser core config shape
      // than ESLint 10's strict defineConfig types; cast to Config to bridge
      // the gap (runtime behavior is unchanged).
      sonarjs.configs?.recommended as Config,
    ],
    plugins: {
      'unused-imports': unusedImports,
      'code-complete': codeComplete,
      react: reactPlugin,
      // react-hooks v7 exposes a nested `configs.flat` map that does not match
      // ESLint's Plugin type; the plugin itself is a valid ESLint plugin.
      'react-hooks': reactHooks as unknown as ESLint.Plugin,
    },
    languageOptions: {
      // eslint-disable-next-line code-complete/no-magic-numbers-except-zero-one
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.storybook.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver': {
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
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // === IMPORT ORGANIZATION ===
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
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
      'import-x/no-duplicates': ['error', { 'prefer-inline': false }],
      'import-x/no-unresolved': 'error',

      // === DISABLE CONFLICTING RULES ===
      '@typescript-eslint/no-unused-vars': 'off', // Use unused-imports plugin
      'no-unused-vars': 'off', // Use unused-imports plugin

      // === UNICORN OVERRIDES ===
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-export-from': 'off',
      'unicorn/no-keyword-prefix': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/no-array-reduce': 'off',

      'sonarjs/void-use': 'off',
      'sonarjs/todo-tag': 'off',

      'code-complete/no-late-argument-usage': 'error',
      'code-complete/enforce-meaningful-names': 'error',
      'code-complete/no-magic-numbers-except-zero-one': 'error',
      'code-complete/no-boolean-params': 'error',

      // Type safety
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Performance and best practices
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',

      // Consistency
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/member-ordering': 'error',

      // JavaScript base rules (enhanced) - Prettier handles formatting
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      'no-throw-literal': 'error',

      // Code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',

      // Error prevention
      'no-unreachable': 'error',
      'no-useless-return': 'error',
      'no-unused-private-class-members': 'error',
      'require-atomic-updates': 'error',

      // React performance
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-unused-prop-types': 'error',
      'react/no-unused-state': 'error',
      'react/prefer-stateless-function': 'warn',

      // React consistency
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
      'react/jsx-pascal-case': 'error',
      'react/self-closing-comp': 'error',

      // Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // === CODE QUALITY ===
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      'sonarjs/no-nested-conditional': 'off',
    },
  },
  {
    // AI provider rules
    files: ['src/lib/providers/**/*.ts'],
    rules: {
      'code-complete/no-magic-numbers-except-zero-one': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-duplicate-imports': 'off',
    },
  },
  {
    // Test files - more relaxed rules
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-null': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      'sonarjs/super-invocation': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'code-complete/enforce-meaningful-names': 'off',
      '@typescript-eslint/require-await': 'off',
      'code-complete/no-magic-numbers-except-zero-one': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'unicorn/prefer-at': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'unicorn/no-array-sort': 'off',
      'sonarjs/no-alphabetical-sort': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'code-complete/no-boolean-params': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    // Storybook files - disable some rules
    files: ['stories/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tsConfigs.recommended, // Use non-type-checked config for stories
      reactRefresh.configs.vite,
      eslintPluginUnicorn.configs.recommended,
      eslintPluginPrettierRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.storybook.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'import-x/no-default-export': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // Use unused-imports plugin
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  {
    // Opinionated rules newly enabled by the eslint-plugin-unicorn v71 and
    // eslint-plugin-sonarjs v4 upgrades. They are disabled here to keep the
    // dependency upgrade free of unrelated churn: several would rename public
    // API (name-replacements, consistent-boolean-name) or reformat doc
    // comments (no-asterisk-prefix-in-documentation-comments). This block runs
    // last so it applies to source, tests, and stories alike. Opt into any of
    // these as separate style changes.
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'unicorn/name-replacements': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/no-asterisk-prefix-in-documentation-comments': 'off',
      'unicorn/prefer-await': 'off',
      'unicorn/prefer-error-is-error': 'off',
      'unicorn/try-complexity': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/no-unnecessary-global-this': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/no-declarations-before-early-exit': 'off',
      'unicorn/prefer-minimal-ternary': 'off',
      'unicorn/prefer-iterator-to-array': 'off',
      'unicorn/prefer-iterator-concat': 'off',
      'unicorn/no-unsafe-property-key': 'off',
      'unicorn/no-incorrect-template-string-interpolation': 'off',
      'unicorn/comment-content': 'off',
      'unicorn/prefer-iterable-in-constructor': 'off',
      'unicorn/prefer-includes-over-repeated-comparisons': 'off',
      'unicorn/prefer-else-if': 'off',
      'unicorn/prefer-continue': 'off',
      'unicorn/prefer-add-event-listener-options': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/no-duplicate-loops': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/consistent-conditional-object-spread': 'off',
      'sonarjs/no-skipped-tests': 'off',
      // Noisy import hygiene warnings that false-positive on flat-config plugin
      // objects imported as defaults (e.g. importX.flatConfigs, sonarjs.configs).
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },
]);
