import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**', '.pnpm-store/**', '.mongo-data/**', '**/next-env.d.ts'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false }],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            eqeqeq: ['error', 'smart'],
        },
    },
    {
        files: ['apps/web/**/*.{ts,tsx}'],
        plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin },
        languageOptions: { globals: { ...globals.browser } },
        settings: { next: { rootDir: 'apps/web' } },
        rules: {
            ...reactHooks.configs.recommended.rules,
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,
        },
    },
    {
        files: ['apps/api/scripts/**/*.ts', 'apps/api/src/DB/cli.ts'],
        rules: { 'no-console': 'off' },
    },
);
