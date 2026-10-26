import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        globalSetup: ['tests/setup/globalSetup.ts'],
        setupFiles: ['tests/setup/testSetup.ts'],
        testTimeout: 30_000,
        hookTimeout: 120_000,
        pool: 'forks',
    },
});
