import { type NextFunction, type Request, type Response } from 'express';
import { ERROR_CODES, type AuthUser } from '@mockapis/api-spec';
import ApiError from '../../errors/ApiErrors';
import { jwtHelper } from '../../helpers/jwtHelper';

/** Demo-only bearer authentication for the practice auth routes. */
const auth =
    (...roles: AuthUser['role'][]) =>
    (req: Request, _res: Response, next: NextFunction) => {
        try {
            const header = req.headers.authorization;
            if (!header) {
                throw ApiError.unauthorized('Missing Authorization header. Send: Authorization: Bearer <accessToken>', ERROR_CODES.MISSING_TOKEN);
            }
            const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
            if (!match) {
                throw ApiError.unauthorized('Malformed Authorization header. Expected format: Bearer <accessToken>', ERROR_CODES.INVALID_AUTH_HEADER);
            }

            const payload = jwtHelper.verifyToken(match[1], 'access');
            req.demoUser = payload;

            if (roles.length > 0 && !roles.includes(payload.user.role)) {
                throw ApiError.forbidden(`This route requires one of these roles: ${roles.join(', ')}. Your role is "${payload.user.role}".`);
            }
            next();
        } catch (error) {
            next(error);
        }
    };

export default auth;
