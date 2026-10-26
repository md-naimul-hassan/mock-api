import crypto from 'crypto';
import { type NextFunction, type Request, type Response } from 'express';

const VALID_INCOMING_ID = /^[A-Za-z0-9._-]{8,64}$/;

/** Accepts a well-formed incoming X-Request-Id, otherwise generates a UUID. */
const requestId = (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.get('x-request-id');
    req.requestId = incoming && VALID_INCOMING_ID.test(incoming) ? incoming : crypto.randomUUID();
    req.validated = {};
    res.setHeader('X-Request-Id', req.requestId);

    const start = process.hrtime.bigint();
    const writeHead = res.writeHead;
    res.writeHead = function (this: Response, ...args: Parameters<typeof writeHead>) {
        const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
        if (!res.headersSent) res.setHeader('X-Response-Time', `${elapsedMs.toFixed(1)}ms`);
        return writeHead.apply(this, args);
    } as typeof writeHead;
    next();
};

export default requestId;
