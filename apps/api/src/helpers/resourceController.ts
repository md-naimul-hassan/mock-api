import { type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ResourceKey } from '@mockapis/api-spec';
import catchAsync from '../shared/catchAsync';
import sendResponse, { sendNoContent } from '../shared/sendResponse';
import type { ListQuery } from './listQuery';
import { assertReferences, createResourceService, type ResourceService } from './resourceService';

type Body = Record<string, unknown>;
type IdParams = { id: number };

const params = (req: Request) => req.validated.params as IdParams;
const query = <T>(req: Request) => req.validated.query as T;
const body = (req: Request) => req.validated.body as Body;

/** Read handlers shared by every resource module. */
export function createReadHandlers(service: ResourceService) {
    const list = catchAsync(async (req: Request, res: Response) => {
        sendResponse(res, await service.list(query<ListQuery>(req)));
    });

    const getById = catchAsync(async (req: Request, res: Response) => {
        const { select } = query<{ select?: string[] }>(req);
        sendResponse(res, await service.getById(params(req).id, select));
    });

    /** Lists `target` records whose `foreignKey` equals the parent ID (404 if the parent does not exist). */
    const relation = (target: ResourceKey, foreignKey: string) => {
        const targetService = createResourceService(target);
        return catchAsync(async (req: Request, res: Response) => {
            const { id } = params(req);
            await service.assertExists(id);
            sendResponse(res, await targetService.list(query<ListQuery>(req), { [foreignKey]: id }));
        });
    };

    return { list, search: list, getById, relation };
}

type MutationOptions = {
    references?: { field: string; resource: ResourceKey }[];
    /** Extra business-rule checks, e.g. uniqueness conflicts. `id` is undefined for create. */
    validate?: (body: Body, id?: number) => Promise<void>;
    /** Fills defaults for full representations (create/replace). */
    complete?: (body: Body) => Body;
};

/**
 * Simulated mutations: the body is validated and the resulting record is returned,
 * but the shared dataset is never written to.
 */
export function createMutationHandlers(service: ResourceService, options: MutationOptions = {}) {
    const { references = [], validate, complete = (value: Body) => value } = options;

    const create = catchAsync(async (req: Request, res: Response) => {
        const payload = body(req);
        await assertReferences(payload, references);
        await validate?.(payload);
        const id = await service.nextId();
        sendResponse(res, { id, ...complete(payload) }, { statusCode: StatusCodes.CREATED, simulated: true });
    });

    const replace = catchAsync(async (req: Request, res: Response) => {
        const { id } = params(req);
        const payload = body(req);
        await service.assertExists(id);
        await assertReferences(payload, references);
        await validate?.(payload, id);
        sendResponse(res, { id, ...complete(payload) }, { simulated: true });
    });

    const patch = catchAsync(async (req: Request, res: Response) => {
        const { id } = params(req);
        const payload = body(req);
        const existing = await service.getById(id);
        await assertReferences(payload, references);
        await validate?.(payload, id);
        sendResponse(res, { ...existing, ...payload, id }, { simulated: true });
    });

    const remove = catchAsync(async (req: Request, res: Response) => {
        await service.assertExists(params(req).id);
        sendNoContent(res, { simulated: true });
    });

    return { create, replace, patch, remove };
}