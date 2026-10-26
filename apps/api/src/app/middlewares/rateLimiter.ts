import { type NextFunction, type Request, type Response } from 'express';
import { rateLimit, type RateLimitInfo, type Store } from 'express-rate-limit';
import { ERROR_CODES } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiErrors';
import { MongoRateLimitStore } from '../../helpers/mongoRateLimitStore';

export type RateLimitOptions = {
    windowMs: number;
    max: number;
    delayMax: number;
    store: 'memory' | 'mongo';
};

const hasDelay = (req: Request) => req.path.startsWith('/test/delay') || req.query.delay !== undefined;

const createStore = (kind: RateLimitOptions['store'], prefix: string): Store | undefined => (kind === 'mongo' ? new MongoRateLimitStore(prefix) : undefined);

const limitHandler = (description: string) => (req: Request, _res: Response, next: NextFunction, options: { windowMs: number; limit: unknown }) => {
    const resetTime = (req as Request & { rateLimit?: RateLimitInfo }).rateLimit?.resetTime;
    const retryAfter = Math.max(1, Math.ceil(((resetTime?.getTime() ?? Date.now() + options.windowMs) - Date.now()) / 1000));
    next(
        new ApiError(
            StatusCodes.TOO_MANY_REQUESTS,
            `Rate limit exceeded: ${description}. Try again in ${retryAfter} seconds.`,
            ERROR_CODES.RATE_LIMIT_EXCEEDED,
            undefined,
            { 'Retry-After': String(retryAfter) },
        ),
    );
};

/** Per-IP limiter for all public API routes plus a stricter limiter for delayed responses. */
export function createRateLimiters(options: RateLimitOptions) {
    // Vercel always sends Forwarded / X-Forwarded-For; trust proxy is enabled in config on Vercel.
    const validate = process.env.VERCEL ? { xForwardedForHeader: false, forwardedHeader: false } : undefined;

    const general = rateLimit({
        windowMs: options.windowMs,
        limit: options.max,
        standardHeaders: 'draft-6',
        legacyHeaders: false,
        passOnStoreError: true,
        validate,
        store: createStore(options.store, 'rl:general:'),
        handler: limitHandler(`${options.max} requests per ${options.windowMs / 1000} seconds`),
    });

    const delayed = rateLimit({
        windowMs: options.windowMs,
        limit: options.delayMax,
        standardHeaders: 'draft-6',
        legacyHeaders: false,
        passOnStoreError: true,
        validate,
        store: createStore(options.store, 'rl:delay:'),
        skip: (req) => !hasDelay(req),
        handler: limitHandler(`${options.delayMax} delayed requests per ${options.windowMs / 1000} seconds`),
    });

    return [general, delayed];
}
