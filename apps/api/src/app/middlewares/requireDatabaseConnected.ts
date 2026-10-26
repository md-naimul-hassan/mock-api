import { type NextFunction, type Request, type Response } from 'express';
import { isDatabaseConnected } from '../../DB';
import ApiError from '../../errors/ApiErrors';

/** Requires MongoDB to be connected (seed not required). Used by Builder / mock runtime. */
const requireDatabaseConnected = (_req: Request, _res: Response, next: NextFunction) => {
    if (!isDatabaseConnected()) {
        return next(ApiError.unavailable('The data store is temporarily unavailable. Please retry shortly.'));
    }
    next();
};

export default requireDatabaseConnected;
