import config from './config';
import { connectWithRetry, markSeeded } from './DB';
import { isSeeded, seedDatabase } from './DB/seed';
import { logger } from './shared/logger';

/**
 * Shared bootstrap for long-running servers and Vercel Fluid/serverless.
 * Idempotent: concurrent callers share one in-flight connection + seed promise.
 */
let ready: Promise<void> | undefined;

async function prepareData() {
    if (config.auto_seed) {
        await seedDatabase({ baseUrl: config.public_api_url });
        markSeeded(true);
        return;
    }
    const seeded = await isSeeded(config.public_api_url);
    markSeeded(seeded);
    if (!seeded) logger.warn('Database is not seeded. Run "pnpm db:seed" (data routes return 503 until then).');
}

export function ensureRuntimeReady(): Promise<void> {
    if (!ready) {
        ready = connectWithRetry(config.database_url, { onConnected: prepareData });
    }
    return ready;
}

/** Fire-and-forget bootstrap so /health can answer while MongoDB is still connecting. */
export function startRuntimeInBackground(): void {
    void ensureRuntimeReady().catch((error) => {
        logger.error({ err: error }, 'Runtime bootstrap failed');
    });
}
