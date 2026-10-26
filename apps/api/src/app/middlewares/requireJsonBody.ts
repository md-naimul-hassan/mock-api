import { type NextFunction, type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiErrors';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

/** Rejects request bodies that are not JSON with 415 instead of silently ignoring them. */
const requireJsonBody = (req: Request, _res: Response, next: NextFunction) => {
    if (!BODY_METHODS.has(req.method)) return next();
    const hasBody = Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined;
    if (hasBody && !req.is(['application/json', 'application/*+json'])) {
        return next(
            new ApiError(
                StatusCodes.UNSUPPORTED_MEDIA_TYPE,
                'Request bodies must be JSON. Set the header Content-Type: application/json',
                ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
            ),
        );
    }
    next();
};

export default requireJsonBody;
