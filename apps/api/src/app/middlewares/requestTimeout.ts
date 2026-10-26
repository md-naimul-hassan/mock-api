import { type NextFunction, type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import { buildErrorBody } from '../../shared/errorBody';

/** Responds with 503 REQUEST_TIMEOUT if a handler has not responded within `timeoutMs`. */
const requestTimeout = (timeoutMs: number) => (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
        if (res.headersSent) return;
        res.setHeader('Retry-After', '5');
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json(
            buildErrorBody(req, StatusCodes.SERVICE_UNAVAILABLE, `The request took longer than ${timeoutMs}ms and was aborted`, ERROR_CODES.REQUEST_TIMEOUT),
        );
    }, timeoutMs);
    timer.unref();
    const clear = () => clearTimeout(timer);
    res.on('finish', clear);
    res.on('close', clear);
    next();
};

export default requestTimeout;
