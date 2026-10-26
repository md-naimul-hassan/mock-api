import { type NextFunction, type Request, type Response } from 'express';
import ApiError from '../../errors/ApiErrors';
import { delayParam } from '../../helpers/listQuery';
import { sleep } from '../../util/text';

/** Honors `?delay=<ms>` (0-5000) on any API route before the handler runs. */
const simulateDelay = async (req: Request, _res: Response, next: NextFunction) => {
    if (req.query.delay === undefined) return next();
    const result = delayParam.safeParse(req.query.delay);
    if (!result.success) {
        const message = result.error.issues[0]?.message ?? 'Invalid delay';
        return next(ApiError.badRequest(`Invalid query parameters: ${message}.`, [{ path: 'delay', message }]));
    }
    await sleep(result.data);
    next();
};

export default simulateDelay;
