import { type Request, type Response } from 'express';
import type { BuilderEndpointBody, BuilderEndpointPatchBody, BuilderLoginBody, BuilderProjectCreateBody, BuilderProjectUpdateBody, BuilderRegisterBody } from '@mockapis/api-spec';
import catchAsync from '../../../shared/catchAsync';
import { BuilderAuthService, BuilderEndpointService, BuilderProjectService } from './builder.service';

const ownerId = (req: Request) => req.builderUser!.user.id;

export const BuilderAuthController = {
    register: catchAsync(async (req: Request, res: Response) => {
        const body = req.validated.body as BuilderRegisterBody;
        res.status(201).json(await BuilderAuthService.register(body));
    }),
    login: catchAsync(async (req: Request, res: Response) => {
        const body = req.validated.body as BuilderLoginBody;
        res.status(200).json(await BuilderAuthService.login(body));
    }),
    me: catchAsync(async (req: Request, res: Response) => {
        res.status(200).json(await BuilderAuthService.me(ownerId(req)));
    }),
};

export const BuilderProjectController = {
    list: catchAsync(async (req: Request, res: Response) => {
        res.status(200).json({ projects: await BuilderProjectService.list(ownerId(req)) });
    }),
    getPublic: catchAsync(async (req: Request, res: Response) => {
        const projectId = String((req.validated.params as { projectId: string }).projectId);
        res.status(200).json(await BuilderProjectService.getPublic(projectId));
    }),
    get: catchAsync(async (req: Request, res: Response) => {
        const projectId = String((req.validated.params as { projectId: string }).projectId);
        res.status(200).json(await BuilderProjectService.get(ownerId(req), projectId));
    }),
    create: catchAsync(async (req: Request, res: Response) => {
        const body = req.validated.body as BuilderProjectCreateBody;
        res.status(201).json(await BuilderProjectService.create(ownerId(req), body));
    }),
    update: catchAsync(async (req: Request, res: Response) => {
        const projectId = String((req.validated.params as { projectId: string }).projectId);
        const body = req.validated.body as BuilderProjectUpdateBody;
        res.status(200).json(await BuilderProjectService.update(ownerId(req), projectId, body));
    }),
    remove: catchAsync(async (req: Request, res: Response) => {
        const projectId = String((req.validated.params as { projectId: string }).projectId);
        res.status(200).json(await BuilderProjectService.remove(ownerId(req), projectId));
    }),
    duplicate: catchAsync(async (req: Request, res: Response) => {
        const projectId = String((req.validated.params as { projectId: string }).projectId);
        res.status(201).json(await BuilderProjectService.duplicate(ownerId(req), projectId));
    }),
};

export const BuilderEndpointController = {
    create: catchAsync(async (req: Request, res: Response) => {
        const projectId = String((req.validated.params as { projectId: string }).projectId);
        const body = req.validated.body as BuilderEndpointBody;
        res.status(201).json(await BuilderEndpointService.create(ownerId(req), projectId, body));
    }),
    update: catchAsync(async (req: Request, res: Response) => {
        const { projectId, endpointId } = req.validated.params as { projectId: string; endpointId: string };
        const body = req.validated.body as BuilderEndpointPatchBody;
        res.status(200).json(await BuilderEndpointService.update(ownerId(req), projectId, endpointId, body));
    }),
    remove: catchAsync(async (req: Request, res: Response) => {
        const { projectId, endpointId } = req.validated.params as { projectId: string; endpointId: string };
        res.status(200).json(await BuilderEndpointService.remove(ownerId(req), projectId, endpointId));
    }),
};
