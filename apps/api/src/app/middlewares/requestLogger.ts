import { type Request, type Response } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../../shared/logger';

/** Structured access log. Only method, path, status, timing, and request ID are logged (no headers, bodies, or query strings). */
const requestLogger = pinoHttp({
    logger,
    genReqId: (req) => (req as Request).requestId,
    customLogLevel: (_req, res, error) => (error || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    customSuccessMessage: (req, res) => `${req.method} ${(req as Request).path ?? req.url} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${(req as Request).path ?? req.url} ${res.statusCode}`,
    serializers: {
        req: (req: { id: string; method: string; url: string }) => ({ id: req.id, method: req.method, path: req.url.split('?')[0] }),
        res: (res: Response) => ({ statusCode: res.statusCode }),
    },
    autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/ready' },
});

export default requestLogger;
