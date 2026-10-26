import { type ErrorRequestHandler, type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiErrors';
import { buildErrorBody } from '../../shared/errorBody';
import { logger } from '../../shared/logger';

type BodyParserError = Error & { type?: string; status?: number; limit?: number };

const fromBodyParser = (error: BodyParserError): ApiError | undefined => {
    switch (error.type) {
        case 'entity.parse.failed':
            return new ApiError(StatusCodes.BAD_REQUEST, 'Request body contains invalid JSON', ERROR_CODES.INVALID_JSON);
        case 'entity.too.large':
            return new ApiError(StatusCodes.REQUEST_TOO_LONG, `Request body is too large (limit ${error.limit} bytes)`, ERROR_CODES.PAYLOAD_TOO_LARGE);
        case 'encoding.unsupported':
        case 'charset.unsupported':
            return new ApiError(StatusCodes.UNSUPPORTED_MEDIA_TYPE, 'Unsupported request body encoding or charset', ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
        default:
            return undefined;
    }
};

const isDatabaseError = (error: Error) =>
    ['MongoServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError', 'MongooseServerSelectionError'].includes(error.name) ||
    /buffering timed out|Client must be connected|connection .* closed/i.test(error.message);

/** Converts every error into the public error schema. Internal details are logged, never returned. */
const globalErrorHandler: ErrorRequestHandler = (error: BodyParserError, req: Request, res: Response, next) => {
    if (res.headersSent) return next(error);

    let apiError = error instanceof ApiError ? error : fromBodyParser(error);
    if (!apiError && isDatabaseError(error)) {
        apiError = ApiError.unavailable('The data store is temporarily unavailable. Please retry shortly.');
    }
    if (!apiError) {
        logger.error({ err: error, requestId: req.requestId, path: req.path }, 'Unhandled error');
        apiError = new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Something went wrong on our side. Please try again later.', ERROR_CODES.INTERNAL_ERROR);
    } else if (apiError.statusCode >= 500) {
        logger.warn({ requestId: req.requestId, code: apiError.code, cause: error.message }, 'Request failed');
    }

    for (const [name, value] of Object.entries(apiError.headers ?? {})) res.setHeader(name, value);
    res.status(apiError.statusCode).json(buildErrorBody(req, apiError.statusCode, apiError.message, apiError.code, apiError.errors));
};

export default globalErrorHandler;
