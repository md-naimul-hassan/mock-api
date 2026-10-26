import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { PAGINATION, RATE_LIMIT_DEFAULTS } from '@mockapis/api-spec';

// Tests and example capture must not depend on a developer's local .env.
if (process.env.NODE_ENV !== 'test') {
    dotenv.config({
        path: [path.join(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')],
        quiet: true,
    });
}

const DEV_ACCESS_SECRET = 'dev-only-access-secret-change-me';
const DEV_REFRESH_SECRET = 'dev-only-refresh-secret-change-me';

const booleanFromEnv = (fallback: boolean) =>
    z
        .enum(['true', 'false', '1', '0'])
        .optional()
        .transform((value) => (value === undefined ? fallback : value === 'true' || value === '1'));

const intFromEnv = (fallback: number, min: number, max: number) => z.coerce.number().int().min(min).max(max).default(fallback);

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: intFromEnv(4000, 1, 65535),
    PUBLIC_API_URL: z
        .url()
        .default(
            process.env.VERCEL_PROJECT_PRODUCTION_URL
                ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
                : process.env.VERCEL_URL
                  ? `https://${process.env.VERCEL_URL}`
                  : 'http://localhost:4000',
        ),
    WEB_URL: z.url().optional(),
    MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/mockapis'),
    AUTO_SEED: booleanFromEnv(true),
    CORS_ORIGINS: z.string().default('*'),
    // Vercel sits behind one proxy; rate limiting needs the real client IP.
    TRUST_PROXY: z.string().default(process.env.VERCEL ? '1' : 'false'),
    BODY_LIMIT: z.string().default('100kb'),
    REQUEST_TIMEOUT_MS: intFromEnv(15_000, 6_000, 120_000),
    DEFAULT_PAGE_LIMIT: intFromEnv(PAGINATION.defaultLimit, 1, 1000),
    MAX_PAGE_LIMIT: intFromEnv(PAGINATION.maxLimit, 1, 1000),
    RATE_LIMIT_WINDOW_MS: intFromEnv(RATE_LIMIT_DEFAULTS.windowMs, 1000, 86_400_000),
    RATE_LIMIT_MAX: intFromEnv(RATE_LIMIT_DEFAULTS.max, 1, 1_000_000),
    RATE_LIMIT_DELAY_MAX: intFromEnv(RATE_LIMIT_DEFAULTS.delayMax, 1, 1_000_000),
    RATE_LIMIT_STORE: z.enum(['memory', 'mongo']).default('memory'),
    JWT_ACCESS_SECRET: z.string().min(16).optional(),
    JWT_REFRESH_SECRET: z.string().min(16).optional(),
    JWT_ACCESS_EXPIRES_MINS: intFromEnv(30, 1, 1440),
    JWT_REFRESH_EXPIRES_MINS: intFromEnv(10_080, 1, 43_200),
    DOCS_ENABLED: booleanFromEnv(true),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
}
const env = parsed.data;

if (env.NODE_ENV === 'production') {
    const secrets = [env.JWT_ACCESS_SECRET, env.JWT_REFRESH_SECRET];
    if (secrets.some((secret) => !secret || secret.length < 32 || /change-?me/i.test(secret))) {
        throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set to random values of at least 32 characters in production.');
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
        throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
    }
}

const parseTrustProxy = (value: string): boolean | number | string => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (/^\d+$/.test(value)) return Number(value);
    return value;
};

const corsOrigins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const config = {
    node_env: env.NODE_ENV,
    is_production: env.NODE_ENV === 'production',
    is_test: env.NODE_ENV === 'test',
    host: env.HOST,
    port: env.PORT,
    public_api_url: env.PUBLIC_API_URL.replace(/\/$/, ''),
    web_url: env.WEB_URL?.replace(/\/$/, '') ?? null,
    database_url: env.MONGODB_URI,
    auto_seed: env.AUTO_SEED,
    cors: {
        origins: corsOrigins.includes('*') ? ('*' as const) : corsOrigins,
    },
    trust_proxy: parseTrustProxy(env.TRUST_PROXY),
    body_limit: env.BODY_LIMIT,
    request_timeout_ms: env.REQUEST_TIMEOUT_MS,
    pagination: {
        default_limit: Math.min(env.DEFAULT_PAGE_LIMIT, env.MAX_PAGE_LIMIT),
        max_limit: env.MAX_PAGE_LIMIT,
    },
    rate_limit: {
        window_ms: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        delay_max: env.RATE_LIMIT_DELAY_MAX,
        store: env.RATE_LIMIT_STORE,
    },
    jwt: {
        access_secret: env.JWT_ACCESS_SECRET ?? DEV_ACCESS_SECRET,
        refresh_secret: env.JWT_REFRESH_SECRET ?? DEV_REFRESH_SECRET,
        access_expires_mins: env.JWT_ACCESS_EXPIRES_MINS,
        refresh_expires_mins: env.JWT_REFRESH_EXPIRES_MINS,
        using_dev_secrets: !env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET,
    },
    docs_enabled: env.DOCS_ENABLED,
    log_level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
};

export type AppConfig = typeof config;
export default config;
