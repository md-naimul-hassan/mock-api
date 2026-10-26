import { Types } from 'mongoose';
import { type Request, type Response } from 'express';
import ApiError from '../../../errors/ApiErrors';
import catchAsync from '../../../shared/catchAsync';
import { MockRuntimeService } from '../builder/builder.service';

/** Serves configured responses for `/api/v1/mock-apis/:projectId/*`. */
export const MockRuntimeController = {
    handle: catchAsync(async (req: Request, res: Response) => {
        const projectId = String(req.params.projectId);
        if (!Types.ObjectId.isValid(projectId)) {
            throw ApiError.notFound('Mock API project was not found.');
        }
        const requestPath = req.path === '/' ? '/' : req.path;
        const result = await MockRuntimeService.resolve(projectId, req.method, requestPath);

        for (const [key, value] of Object.entries(result.endpoint.responseHeaders ?? {})) {
            // Do not let user headers override security / request-id plumbing.
            if (/^(content-length|transfer-encoding|connection|host|x-request-id)$/i.test(key)) continue;
            res.setHeader(key, String(value));
        }
        res.setHeader('X-MockAPIs-Builder', 'true');
        res.setHeader('X-MockAPIs-Project', String(result.project._id));

        if (result.endpoint.statusCode === 204) {
            res.status(204).end();
            return;
        }
        res.status(result.endpoint.statusCode).json(result.endpoint.responseBody ?? null);
    }),
};
