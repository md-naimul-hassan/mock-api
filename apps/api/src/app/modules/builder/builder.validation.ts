import { z } from 'zod';
import {
    BuilderEndpointBody,
    BuilderEndpointPatchBody,
    BuilderLoginBody,
    BuilderProjectCreateBody,
    BuilderProjectUpdateBody,
    BuilderRegisterBody,
} from '@mockapis/api-spec';

const objectId = z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, 'must be a valid MongoDB ObjectId');

const projectIdParams = z.object({
    projectId: objectId,
});

const endpointIdParams = z.object({
    projectId: objectId,
    endpointId: objectId,
});

export const builderValidation = {
    register: { body: BuilderRegisterBody },
    login: { body: BuilderLoginBody },
    projectId: { params: projectIdParams },
    createProject: { body: BuilderProjectCreateBody },
    updateProject: { params: projectIdParams, body: BuilderProjectUpdateBody },
    createEndpoint: { params: projectIdParams, body: BuilderEndpointBody },
    updateEndpoint: { params: endpointIdParams, body: BuilderEndpointPatchBody },
    deleteEndpoint: { params: endpointIdParams },
};
