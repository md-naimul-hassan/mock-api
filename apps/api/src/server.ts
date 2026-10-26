import { type Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config';
import { connectWithRetry, disconnectDatabase, markSeeded } from './DB';
import { isSeeded, seedDatabase } from './DB/seed';
import { logger } from './shared/logger';

process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
});

let server: Server | undefined;

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

async function main() {
    if (config.jwt.using_dev_secrets) {
        logger.warn('Using development JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET for shared deployments.');
    }

    server = app.listen(config.port, config.host, () => {
        logger.info(`Mock APIs listening on http://${config.host}:${config.port} (public URL ${config.public_api_url})`);
    });
    server.requestTimeout = config.request_timeout_ms + 5_000;
    server.headersTimeout = 20_000;
    server.keepAliveTimeout = 65_000;

    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
    mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

    // The HTTP server starts first so /health responds while the database is still connecting.
    await connectWithRetry(config.database_url, { onConnected: prepareData });
}

async function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down`);
    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    await disconnectDatabase().catch(() => undefined);
    process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

main().catch((error) => {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
});
