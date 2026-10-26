import { type NextFunction, type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import ApiError from '../../../errors/ApiErrors';
import { builderJwt } from '../../../helpers/builderJwt';

/** Bearer auth for Mock API Builder management routes (separate from demo practice JWT). */
export const requireBuilderAuth = (req: Request, _res: Response, next: NextFunction) => {
    try {
        const header = req.headers.authorization;
        if (!header) {
            throw ApiError.unauthorized('Missing Authorization header. Send: Authorization: Bearer <builderAccessToken>', ERROR_CODES.MISSING_TOKEN);
        }
        const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
        if (!match) {
            throw ApiError.unauthorized('Malformed Authorization header. Expected format: Bearer <builderAccessToken>', ERROR_CODES.INVALID_AUTH_HEADER);
        }
        req.builderUser = builderJwt.verifyAccessToken(match[1]);
        next();
    } catch (error) {
        next(error);
    }
};
