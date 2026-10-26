import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { API_PREFIX, EXPOSED_RESPONSE_HEADERS } from '@mockapis/api-spec';
import config from './config';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import { createRateLimiters, type RateLimitOptions } from './app/middlewares/rateLimiter';
import requestId from './app/middlewares/requestId';
import requestLogger from './app/middlewares/requestLogger';
import requestTimeout from './app/middlewares/requestTimeout';
import requireJsonBody from './app/middlewares/requireJsonBody';
import simulateDelay from './app/middlewares/simulateDelay';
import { getOpenApiDocument, SystemController } from './app/modules/system/system.controller';
import router from './app/routes';

export type AppOptions = {
    rateLimit?: Partial<RateLimitOptions>;
    logRequests?: boolean;
};

const apiHelmet = helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    // Public API: images and JSON may be loaded from any origin.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});

const docsHelmet = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
        },
    },
});

export function createApp(options: AppOptions = {}) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', config.trust_proxy);
    app.set('query parser', 'simple');

    app.use(requestId);
    if (options.logRequests ?? !config.is_test) app.use(requestLogger);
    app.use((req: Request, res: Response, next: NextFunction) => (req.path.startsWith('/docs') ? docsHelmet : apiHelmet)(req, res, next));
    app.use(
        cors({
            origin: config.cors.origins,
            credentials: false,
            methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            exposedHeaders: [...EXPOSED_RESPONSE_HEADERS],
            maxAge: 600,
        }),
    );
    app.use(requestTimeout(config.request_timeout_ms));

    // Probes and the spec are not rate limited.
    app.get('/health', SystemController.health);
    app.get('/ready', SystemController.ready);
    app.get('/openapi.json', SystemController.openapi);
    if (config.docs_enabled) {
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(getOpenApiDocument(), { customSiteTitle: 'Mock APIs - API Reference' }));
    }

    app.use(
        API_PREFIX,
        ...createRateLimiters({
            windowMs: config.rate_limit.window_ms,
            max: config.rate_limit.max,
            delayMax: config.rate_limit.delay_max,
            store: config.rate_limit.store,
            ...options.rateLimit,
        }),
    );
    app.use(API_PREFIX, requireJsonBody, express.json({ limit: config.body_limit, type: ['application/json', 'application/*+json'] }));
    app.use(API_PREFIX, (req: Request, res: Response, next: NextFunction) => (req.path.startsWith('/test/delay') ? next() : simulateDelay(req, res, next)));
    app.use(API_PREFIX, router);

    app.get('/', (_req: Request, res: Response) => {
        res.json({
            name: 'Mock APIs',
            message: 'Free REST APIs for learning, building, and testing.',
            api: `${config.public_api_url}${API_PREFIX}`,
            openapi: `${config.public_api_url}/openapi.json`,
            docs: config.docs_enabled ? `${config.public_api_url}/docs` : null,
        });
    });

    app.use(notFound);
    app.use(globalErrorHandler);
    return app;
}

const app = createApp();
export default app;
