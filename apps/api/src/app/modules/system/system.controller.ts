import { type Request, type Response } from 'express';
import { API_NAME, API_PREFIX, API_VERSION, buildOpenApiDocument, MAX_DELAY_MS, RESOURCE_KEYS, resources } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { databaseStatus, isDatabaseReady } from '../../../DB';
import ApiError from '../../../errors/ApiErrors';
import sendResponse from '../../../shared/sendResponse';

const startedAt = new Date();

const root = (_req: Request, res: Response) => {
    const base = `${config.public_api_url}${API_PREFIX}`;
    sendResponse(res, {
        name: API_NAME,
        version: API_VERSION,
        description: 'Free REST APIs for learning, building, and testing. No API key required.',
        baseUrl: base,
        documentation: {
            openapi: `${config.public_api_url}/openapi.json`,
            swaggerUi: config.docs_enabled ? `${config.public_api_url}/docs` : null,
            website: config.web_url,
        },
        resources: RESOURCE_KEYS.map((key) => ({
            name: key,
            url: `${base}/${key}`,
            description: resources[key].description,
            writable: resources[key].mutable,
        })),
        authentication: {
            login: `${base}/auth/login`,
            note: 'Demo-only authentication for practice. Never use it to secure real applications.',
        },
        testing: {
            echo: `${base}/test/echo`,
            delay: `${base}/test/delay?ms=1000`,
            status: `${base}/test/status/404`,
        },
        limits: {
            defaultPageSize: config.pagination.default_limit,
            maxPageSize: config.pagination.max_limit,
            maxDelayMs: MAX_DELAY_MS,
            rateLimit: { requests: config.rate_limit.max, windowSeconds: config.rate_limit.window_ms / 1000 },
        },
        notice: 'POST, PUT, PATCH, and DELETE requests are simulated. They return realistic responses but never modify the shared dataset.',
    });
};

const health = (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    sendResponse(res, {
        status: 'ok',
        version: API_VERSION,
        uptimeSeconds: Math.round(process.uptime()),
        startedAt: startedAt.toISOString(),
        database: databaseStatus(),
    });
};

const ready = (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!isDatabaseReady()) throw ApiError.unavailable(`Not ready: database is ${databaseStatus()}`);
    sendResponse(res, { status: 'ready', database: databaseStatus() }, { statusCode: StatusCodes.OK });
};

let cachedSpec: object | undefined;
const openapi = (_req: Request, res: Response) => {
    cachedSpec ??= buildOpenApiDocument({ serverUrl: config.public_api_url });
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Disposition', 'inline; filename="mock-apis.openapi.json"');
    sendResponse(res, cachedSpec);
};

export const getOpenApiDocument = () => (cachedSpec ??= buildOpenApiDocument({ serverUrl: config.public_api_url }));

export const SystemController = { root, health, ready, openapi };
