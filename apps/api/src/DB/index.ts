import mongoose from 'mongoose';
import { logger } from '../shared/logger';
import { sleep } from '../util/text';

mongoose.set('strictQuery', true);
// Fail fast instead of queueing queries while disconnected; routes respond 503 instead.
mongoose.set('bufferCommands', false);

const state = { seeded: false };

export const markSeeded = (seeded: boolean) => {
    state.seeded = seeded;
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const isDatabaseReady = () => isDatabaseConnected() && state.seeded;

export const databaseStatus = () => {
    const states: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    return states[mongoose.connection.readyState] ?? 'unknown';
};

export async function connectDatabase(uri: string) {
    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8_000,
        // Serverless / Fluid: keep the pool small; connections are reused across warm invocations.
        maxPoolSize: process.env.VERCEL ? 5 : 20,
    });
    logger.info({ host: mongoose.connection.host, db: mongoose.connection.name }, 'MongoDB connected');
}

/** Retries the initial connection with exponential backoff so the HTTP server can start first. */
export async function connectWithRetry(uri: string, { maxDelayMs = 30_000, onConnected }: { maxDelayMs?: number; onConnected?: () => Promise<void> } = {}) {
    // On Vercel, fail fast inside the request instead of looping until the function times out.
    const maxAttempts = process.env.VERCEL ? 3 : Number.POSITIVE_INFINITY;
    let delay = 1000;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await connectDatabase(uri);
            if (onConnected) await onConnected();
            return;
        } catch (error) {
            logger.error({ err: error, attempt, retryInMs: delay }, 'MongoDB connection failed');
            await mongoose.disconnect().catch(() => undefined);
            if (attempt >= maxAttempts) throw error;
            await sleep(delay);
            delay = Math.min(delay * 2, maxDelayMs);
        }
    }
}

export async function disconnectDatabase() {
    await mongoose.disconnect();
}
