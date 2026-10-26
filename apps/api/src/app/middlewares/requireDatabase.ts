import { type NextFunction, type Request, type Response } from 'express';
import { isDatabaseReady } from '../../DB';
import ApiError from '../../errors/ApiErrors';

/** Returns 503 instead of hanging or failing obscurely when MongoDB is unavailable. */
const requireDatabase = (_req: Request, _res: Response, next: NextFunction) => {
    if (!isDatabaseReady()) {
        return next(ApiError.unavailable('The data store is temporarily unavailable. Please retry shortly.'));
    }
    next();
};

export default requireDatabase;
