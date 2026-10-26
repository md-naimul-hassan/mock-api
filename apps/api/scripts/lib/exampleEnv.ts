// Imported first by scripts/tests so config sees these values when it loads.
Object.assign(process.env, {
    NODE_ENV: 'test',
    PUBLIC_API_URL: 'http://localhost:4000',
    RATE_LIMIT_MAX: '100000',
    RATE_LIMIT_DELAY_MAX: '100000',
    AUTO_SEED: 'false',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-0123456789',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-0123456789',
});
