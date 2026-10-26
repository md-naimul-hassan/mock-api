import {
    BUILDER_LIMITS,
    ERROR_CODES,
    MOCK_RUNTIME_PREFIX,
    type BuilderEndpointBody,
    type BuilderEndpointPatchBody,
    type BuilderHttpMethod,
    type BuilderLoginBody,
    type BuilderProjectCreateBody,
    type BuilderProjectUpdateBody,
    type BuilderRegisterBody,
} from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import { Types, type FlattenMaps } from 'mongoose';
import ApiError from '../../../errors/ApiErrors';
import { builderJwt } from '../../../helpers/builderJwt';
import { hashPasswordRandom, verifyPassword } from '../../../util/password';
import { sleep } from '../../../util/text';
import { BuilderUser, MockEndpoint, MockProject, type IMockEndpoint, type IMockProject } from './builder.models';
import { matchEndpointPath, rankEndpointMatch } from './builder.pathMatch';

const ACCESS_EXPIRES_MINS = 60 * 24 * 7; // 7 days for builder sessions

const toIso = (value: Date) => value.toISOString();
const idOf = (value: Types.ObjectId | string) => String(value);

function asObjectId(value: string) {
    const id = String(value ?? '');
    if (!Types.ObjectId.isValid(id) || String(new Types.ObjectId(id)) !== id) {
        throw ApiError.unauthorized('Your builder session is out of date. Please log in again.', ERROR_CODES.INVALID_TOKEN);
    }
    return new Types.ObjectId(id);
}

const projectBasePath = (projectId: string) => `${MOCK_RUNTIME_PREFIX}/${projectId}`;

const serializeUser = (user: { _id: Types.ObjectId; username: string; email: string; createdAt: Date }) => ({
    id: idOf(user._id),
    username: user.username,
    email: user.email,
    createdAt: toIso(user.createdAt),
});

const serializeEndpoint = (endpoint: FlattenMaps<IMockEndpoint> | IMockEndpoint) => ({
    id: idOf(endpoint._id),
    projectId: idOf(endpoint.projectId),
    method: endpoint.method,
    path: endpoint.path,
    statusCode: endpoint.statusCode,
    requestBody: endpoint.requestBody ?? null,
    responseBody: endpoint.responseBody ?? null,
    responseHeaders: (endpoint.responseHeaders ?? {}) as Record<string, string>,
    delayMs: endpoint.delayMs ?? 0,
    description: endpoint.description ?? '',
    enabled: endpoint.enabled,
    createdAt: toIso(endpoint.createdAt),
    updatedAt: toIso(endpoint.updatedAt),
});

const serializeProject = (project: FlattenMaps<IMockProject> | IMockProject, endpointCount: number) => ({
    id: idOf(project._id),
    name: project.name,
    description: project.description ?? '',
    enabled: project.enabled,
    basePath: projectBasePath(idOf(project._id)),
    endpointCount,
    createdAt: toIso(project.createdAt),
    updatedAt: toIso(project.updatedAt),
});

async function assertOwnedProject(projectId: string, ownerId: string) {
    if (!Types.ObjectId.isValid(projectId)) throw ApiError.notFound(`Mock API project ${projectId} was not found.`);
    const project = (await MockProject.findById(projectId).lean()) as FlattenMaps<IMockProject> | null;
    if (!project) throw ApiError.notFound(`Mock API project ${projectId} was not found.`);
    if (idOf(project.ownerId) !== ownerId) throw ApiError.forbidden('You do not own this mock API project.');
    return project;
}

export const BuilderAuthService = {
    async register(body: BuilderRegisterBody) {
        const existing = await BuilderUser.findOne({ $or: [{ username: body.username }, { email: body.email }] }).lean();
        if (existing) {
            const field = existing.username === body.username ? 'username' : 'email';
            throw ApiError.conflict(`A builder account with this ${field} already exists.`, [{ path: field, message: 'Already taken' }]);
        }
        const user = await BuilderUser.create({
            username: body.username,
            email: body.email,
            passwordHash: hashPasswordRandom(body.password),
        });
        const publicUser = serializeUser(user);
        return {
            accessToken: builderJwt.createAccessToken(publicUser, ACCESS_EXPIRES_MINS),
            expiresInMins: ACCESS_EXPIRES_MINS,
            user: publicUser,
        };
    },

    async login(body: BuilderLoginBody) {
        const user = await BuilderUser.findOne({ username: body.username }).select('+passwordHash').lean();
        if (!user || !verifyPassword(body.password, user.passwordHash)) {
            throw ApiError.unauthorized('Invalid username or password.', ERROR_CODES.INVALID_CREDENTIALS);
        }
        const publicUser = serializeUser(user);
        return {
            accessToken: builderJwt.createAccessToken(publicUser, ACCESS_EXPIRES_MINS),
            expiresInMins: ACCESS_EXPIRES_MINS,
            user: publicUser,
        };
    },

    async me(userId: string) {
        if (!Types.ObjectId.isValid(userId)) {
            throw ApiError.unauthorized('Builder account not found.', ERROR_CODES.INVALID_TOKEN);
        }
        const user = await BuilderUser.findById(userId).lean();
        if (!user) throw ApiError.unauthorized('Builder account not found.', ERROR_CODES.INVALID_TOKEN);
        return serializeUser(user);
    },
};

export const BuilderProjectService = {
    async list(ownerId: string) {
        const projects = (await MockProject.find({ ownerId: asObjectId(ownerId) }).sort({ updatedAt: -1 }).lean()) as FlattenMaps<IMockProject>[];
        const projectIds = projects.map((project) => project._id);
        const counts = await MockEndpoint.aggregate<{ _id: Types.ObjectId; count: number }>([
            { $match: { projectId: { $in: projectIds } } },
            { $group: { _id: '$projectId', count: { $sum: 1 } } },
        ]);
        const countById = new Map(counts.map((row) => [idOf(row._id), row.count]));
        return projects.map((project) => serializeProject(project, countById.get(idOf(project._id)) ?? 0));
    },

    async get(ownerId: string, projectId: string) {
        const project = await assertOwnedProject(projectId, ownerId);
        const endpoints = (await MockEndpoint.find({ projectId: project._id }).sort({ path: 1, method: 1 }).lean()) as FlattenMaps<IMockEndpoint>[];
        return { ...serializeProject(project, endpoints.length), endpoints: endpoints.map(serializeEndpoint) };
    },

    /** Public docs payload for shareable Swagger-style pages (no owner identity). */
    async getPublic(projectId: string) {
        if (!Types.ObjectId.isValid(projectId)) throw ApiError.notFound('Mock API project was not found.');
        const project = (await MockProject.findById(projectId).lean()) as FlattenMaps<IMockProject> | null;
        if (!project) throw ApiError.notFound('Mock API project was not found.');
        if (!project.enabled) {
            throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'This mock API project is disabled.', ERROR_CODES.SERVICE_UNAVAILABLE, undefined, {
                'Retry-After': '60',
            });
        }
        const endpoints = (
            (await MockEndpoint.find({ projectId: project._id, enabled: true }).sort({ path: 1, method: 1 }).lean()) as FlattenMaps<IMockEndpoint>[]
        ).map(serializeEndpoint);
        return {
            ...serializeProject(project, endpoints.length),
            endpoints,
            sharePath: `/builder/share/${idOf(project._id)}`,
        };
    },

    async create(ownerId: string, body: BuilderProjectCreateBody) {
        const count = await MockProject.countDocuments({ ownerId: asObjectId(ownerId) });
        if (count >= BUILDER_LIMITS.maxProjectsPerUser) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                `You can create at most ${BUILDER_LIMITS.maxProjectsPerUser} mock API projects.`,
                ERROR_CODES.QUOTA_EXCEEDED,
            );
        }
        const project = await MockProject.create({
            ownerId: asObjectId(ownerId),
            name: body.name,
            description: body.description ?? '',
            enabled: body.enabled ?? true,
        });
        return serializeProject(project, 0);
    },

    async update(ownerId: string, projectId: string, body: BuilderProjectUpdateBody) {
        await assertOwnedProject(projectId, ownerId);
        const updated = (await MockProject.findOneAndUpdate(
            { _id: projectId, ownerId: asObjectId(ownerId) },
            { $set: body },
            { returnDocument: 'after' },
        ).lean()) as FlattenMaps<IMockProject> | null;
        if (!updated) throw ApiError.notFound(`Mock API project ${projectId} was not found.`);
        const endpointCount = await MockEndpoint.countDocuments({ projectId: updated._id });
        return serializeProject(updated, endpointCount);
    },

    async remove(ownerId: string, projectId: string) {
        await assertOwnedProject(projectId, ownerId);
        await MockEndpoint.deleteMany({ projectId: asObjectId(projectId) });
        await MockProject.deleteOne({ _id: projectId, ownerId: asObjectId(ownerId) });
        return { deleted: true, id: projectId };
    },

    async duplicate(ownerId: string, projectId: string) {
        const source = await BuilderProjectService.get(ownerId, projectId);
        const copy = await BuilderProjectService.create(ownerId, {
            name: `${source.name} (copy)`,
            description: source.description,
            enabled: source.enabled,
        });
        for (const endpoint of source.endpoints) {
            await BuilderEndpointService.create(ownerId, copy.id, {
                method: endpoint.method,
                path: endpoint.path,
                statusCode: endpoint.statusCode as BuilderEndpointBody['statusCode'],
                requestBody: endpoint.requestBody,
                responseBody: endpoint.responseBody,
                responseHeaders: endpoint.responseHeaders,
                delayMs: endpoint.delayMs,
                description: endpoint.description,
                enabled: endpoint.enabled,
            });
        }
        return BuilderProjectService.get(ownerId, copy.id);
    },
};

export const BuilderEndpointService = {
    async create(ownerId: string, projectId: string, body: BuilderEndpointBody) {
        await assertOwnedProject(projectId, ownerId);
        const projectObjectId = asObjectId(projectId);
        const count = await MockEndpoint.countDocuments({ projectId: projectObjectId });
        if (count >= BUILDER_LIMITS.maxEndpointsPerProject) {
            throw new ApiError(
                StatusCodes.FORBIDDEN,
                `A project can have at most ${BUILDER_LIMITS.maxEndpointsPerProject} endpoints.`,
                ERROR_CODES.QUOTA_EXCEEDED,
            );
        }
        const conflict = await MockEndpoint.findOne({ projectId: projectObjectId, method: body.method, path: body.path }).lean();
        if (conflict) {
            throw ApiError.conflict(`An endpoint already exists for ${body.method} ${body.path}.`, [
                { path: 'path', message: 'Method + path must be unique within a project' },
            ]);
        }
        const endpoint = await MockEndpoint.create({
            projectId: projectObjectId,
            method: body.method,
            path: body.path,
            statusCode: body.statusCode,
            requestBody: body.method === 'GET' ? null : (body.requestBody ?? null),
            responseBody: body.responseBody ?? null,
            responseHeaders: body.responseHeaders ?? {},
            delayMs: body.delayMs ?? 0,
            description: body.description ?? '',
            enabled: body.enabled ?? true,
        });
        await MockProject.updateOne({ _id: projectObjectId }, { $set: { updatedAt: new Date() } });
        return serializeEndpoint(endpoint);
    },

    async update(ownerId: string, projectId: string, endpointId: string, body: BuilderEndpointPatchBody) {
        await assertOwnedProject(projectId, ownerId);
        if (!Types.ObjectId.isValid(endpointId)) throw ApiError.notFound(`Endpoint ${endpointId} was not found in this project.`);
        const projectObjectId = asObjectId(projectId);
        const existing = (await MockEndpoint.findOne({ _id: endpointId, projectId: projectObjectId }).lean()) as FlattenMaps<IMockEndpoint> | null;
        if (!existing) throw ApiError.notFound(`Endpoint ${endpointId} was not found in this project.`);

        const nextMethod = body.method ?? existing.method;
        const nextPath = body.path ?? existing.path;
        if (nextMethod !== existing.method || nextPath !== existing.path) {
            const conflict = await MockEndpoint.findOne({
                projectId: projectObjectId,
                method: nextMethod,
                path: nextPath,
                _id: { $ne: existing._id },
            }).lean();
            if (conflict) {
                throw ApiError.conflict(`An endpoint already exists for ${nextMethod} ${nextPath}.`, [
                    { path: 'path', message: 'Method + path must be unique within a project' },
                ]);
            }
        }

        const nextRequestBody =
            nextMethod === 'GET' ? null : body.requestBody !== undefined ? body.requestBody : existing.requestBody ?? null;
        const updated = (await MockEndpoint.findOneAndUpdate(
            { _id: endpointId, projectId: projectObjectId },
            { $set: { ...body, method: nextMethod, path: nextPath, requestBody: nextRequestBody } },
            { returnDocument: 'after' },
        ).lean()) as FlattenMaps<IMockEndpoint> | null;
        if (!updated) throw ApiError.notFound(`Endpoint ${endpointId} was not found in this project.`);
        await MockProject.updateOne({ _id: projectObjectId }, { $set: { updatedAt: new Date() } });
        return serializeEndpoint(updated);
    },

    async remove(ownerId: string, projectId: string, endpointId: string) {
        await assertOwnedProject(projectId, ownerId);
        if (!Types.ObjectId.isValid(endpointId)) throw ApiError.notFound(`Endpoint ${endpointId} was not found in this project.`);
        const result = await MockEndpoint.deleteOne({ _id: endpointId, projectId: asObjectId(projectId) });
        if (result.deletedCount === 0) throw ApiError.notFound(`Endpoint ${endpointId} was not found in this project.`);
        await MockProject.updateOne({ _id: projectId }, { $set: { updatedAt: new Date() } });
        return { deleted: true, id: endpointId };
    },
};

export const MockRuntimeService = {
    async resolve(projectId: string, method: string, requestPath: string) {
        if (!Types.ObjectId.isValid(projectId)) throw ApiError.notFound('Mock API project was not found.');
        const project = (await MockProject.findById(projectId).lean()) as FlattenMaps<IMockProject> | null;
        if (!project) throw ApiError.notFound('Mock API project was not found.');
        if (!project.enabled) {
            throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'This mock API project is disabled.', ERROR_CODES.SERVICE_UNAVAILABLE, undefined, {
                'Retry-After': '60',
            });
        }

        const upperMethod = method.toUpperCase() as BuilderHttpMethod;
        const endpoints = (await MockEndpoint.find({
            projectId: project._id,
            enabled: true,
            method: upperMethod,
        }).lean()) as FlattenMaps<IMockEndpoint>[];
        const matches = endpoints
            .map((endpoint) => {
                const params = matchEndpointPath(endpoint.path, requestPath);
                return params ? { endpoint, params, rank: rankEndpointMatch(endpoint.path) } : null;
            })
            .filter((value): value is NonNullable<typeof value> => value !== null)
            .sort((a, b) => b.rank - a.rank);

        if (matches.length === 0) {
            const allowed = (await MockEndpoint.find({ projectId: project._id, enabled: true, path: requestPath }).distinct('method')) as string[];
            if (allowed.length > 0) {
                throw new ApiError(StatusCodes.METHOD_NOT_ALLOWED, `Method ${upperMethod} is not allowed for this path.`, ERROR_CODES.METHOD_NOT_ALLOWED, undefined, {
                    Allow: allowed.join(', '),
                });
            }
            throw new ApiError(StatusCodes.NOT_FOUND, `No mock endpoint matched ${upperMethod} ${requestPath}.`, ERROR_CODES.ROUTE_NOT_FOUND);
        }

        const { endpoint, params } = matches[0];
        if (endpoint.delayMs > 0) await sleep(endpoint.delayMs);
        return { project, endpoint, params };
    },
};
