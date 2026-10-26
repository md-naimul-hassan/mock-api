import { type NextFunction, type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../errors/ApiErrors';

/** Use as `.all(methodNotAllowed('GET', 'POST'))` at the end of a route chain. */
const methodNotAllowed =
    (...allowed: string[]) =>
    (req: Request, _res: Response, next: NextFunction) => {
        const allow = allowed.includes('GET') ? [...allowed, 'HEAD', 'OPTIONS'] : [...allowed, 'OPTIONS'];
        next(
            new ApiError(
                StatusCodes.METHOD_NOT_ALLOWED,
                `Method ${req.method} is not allowed on this route. Allowed: ${allowed.join(', ')}`,
                ERROR_CODES.METHOD_NOT_ALLOWED,
                undefined,
                { Allow: allow.join(', ') },
            ),
        );
    };

export default methodNotAllowed;
