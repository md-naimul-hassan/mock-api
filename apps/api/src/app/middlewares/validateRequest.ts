import { type NextFunction, type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import { z } from 'zod';
import ApiError from '../../errors/ApiErrors';
import { zodIssuesToMessages } from '../../errors/handleZodError';

type Schemas = {
    params?: z.ZodType;
    query?: z.ZodType;
    body?: z.ZodType;
};

const isPlainObject = (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Validates params (400 INVALID_ID), query (400 INVALID_PARAMETER), and JSON body (422 VALIDATION_ERROR).
 * Parsed values are stored on `req.validated` because Express 5 `req.query` is read-only.
 */
const validateRequest = (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
            const errors = zodIssuesToMessages(result.error);
            return next(ApiError.badRequest(errors[0]?.message ?? 'Invalid path parameter', errors, ERROR_CODES.INVALID_ID));
        }
        req.validated.params = result.data;
    }

    if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
            const errors = result.error.issues.map((issue) =>
                issue.code === 'unrecognized_keys'
                    ? { path: issue.keys.join(','), message: `Unknown query parameter(s): ${issue.keys.join(', ')}` }
                    : { path: issue.path.map(String).join('.'), message: issue.message },
            );
            const allowed = schemas.query instanceof z.ZodObject ? Object.keys(schemas.query.shape) : [];
            const hint = errors.some((error) => error.message.startsWith('Unknown query parameter')) && allowed.length > 0 ? ` Allowed parameters: ${allowed.join(', ')}.` : '';
            return next(ApiError.badRequest(`Invalid query parameters: ${errors.map((error) => error.message).join('; ')}.${hint}`, errors));
        }
        req.validated.query = result.data;
    }

    if (schemas.body) {
        if (!isPlainObject(req.body)) {
            return next(ApiError.validation('Request body must be a JSON object. Send JSON with the header Content-Type: application/json', [{ path: 'body', message: 'Expected a JSON object' }]));
        }
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
            const errors = zodIssuesToMessages(result.error);
            return next(ApiError.validation(`Validation failed: ${errors.map((error) => (error.path ? `${error.path}: ${error.message}` : error.message)).join('; ')}`, errors));
        }
        req.validated.body = result.data;
    }
    next();
};

export default validateRequest;
