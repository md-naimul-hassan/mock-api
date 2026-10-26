import { z } from 'zod';
import { ALLOWED_TEST_STATUS_CODES, MAX_DELAY_MS } from './constants';

/** Quotas for the custom Mock API Builder (abuse protection). */
export const BUILDER_LIMITS = {
    maxProjectsPerUser: 20,
    maxEndpointsPerProject: 50,
    maxNameLength: 80,
    maxDescriptionLength: 500,
    maxPathLength: 200,
    maxHeaderNameLength: 64,
    maxHeaderValueLength: 500,
    maxHeaders: 20,
    /** Serialized JSON response body size in UTF-8 bytes. */
    maxResponseBodyBytes: 50_000,
    maxDelayMs: MAX_DELAY_MS,
    usernameMin: 3,
    usernameMax: 32,
    passwordMin: 8,
    passwordMax: 128,
} as const;

export const BUILDER_HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type BuilderHttpMethod = (typeof BUILDER_HTTP_METHODS)[number];

export const BUILDER_STATUS_CODES = ALLOWED_TEST_STATUS_CODES;

const requiredMessage = (field: string, type: string) => (issue: { input?: unknown }) =>
    issue.input === undefined ? `${field} is required` : `${field} must be ${type}`;

export const BuilderRegisterBody = z.object({
    username: z
        .string({ error: requiredMessage('username', 'a string') })
        .trim()
        .toLowerCase()
        .min(BUILDER_LIMITS.usernameMin)
        .max(BUILDER_LIMITS.usernameMax)
        .regex(/^[a-z][a-z0-9_]*$/, 'username must start with a letter and contain only lowercase letters, digits, and underscores'),
    email: z.email({ error: requiredMessage('email', 'a valid email') }).trim().toLowerCase().max(120),
    password: z
        .string({ error: requiredMessage('password', 'a string') })
        .min(BUILDER_LIMITS.passwordMin)
        .max(BUILDER_LIMITS.passwordMax),
});
export type BuilderRegisterBody = z.infer<typeof BuilderRegisterBody>;

export const BuilderLoginBody = z.object({
    username: z.string({ error: requiredMessage('username', 'a string') }).trim().toLowerCase().min(1).max(BUILDER_LIMITS.usernameMax),
    password: z.string({ error: requiredMessage('password', 'a string') }).min(1).max(BUILDER_LIMITS.passwordMax),
});
export type BuilderLoginBody = z.infer<typeof BuilderLoginBody>;

export const BuilderUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    createdAt: z.string(),
});
export type BuilderUser = z.infer<typeof BuilderUserSchema>;

export const BuilderAuthResponseSchema = z.object({
    accessToken: z.string(),
    expiresInMins: z.number().int().positive(),
    user: BuilderUserSchema,
});
export type BuilderAuthResponse = z.infer<typeof BuilderAuthResponseSchema>;

/** Endpoint path relative to the project base, e.g. `/api/users` or `/api/users/:id`. */
export const BuilderEndpointPath = z
    .string({ error: requiredMessage('path', 'a string') })
    .trim()
    .min(1)
    .max(BUILDER_LIMITS.maxPathLength)
    .regex(/^\/(?:[A-Za-z0-9._~!$&'()*+,;=:@%{}-]+(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%{}-]*)*)?$/, 'path must start with / and use URL-safe segments (use :name for params)')
    .refine((path) => !path.includes('//'), 'path must not contain empty segments')
    .refine((path) => !path.split('/').some((part) => part === '..' || part === '.'), 'path must not contain . or .. segments');

const HeaderRecord = z
    .record(z.string().max(BUILDER_LIMITS.maxHeaderNameLength), z.string().max(BUILDER_LIMITS.maxHeaderValueLength))
    .refine((headers) => Object.keys(headers).length <= BUILDER_LIMITS.maxHeaders, `at most ${BUILDER_LIMITS.maxHeaders} response headers`)
    .refine(
        (headers) => Object.keys(headers).every((key) => /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(key)),
        'response header names must be valid HTTP token names',
    );

const jsonBodySize = (value: unknown) => new TextEncoder().encode(JSON.stringify(value ?? null)).length;

const BuilderEndpointFields = {
    method: z.enum(BUILDER_HTTP_METHODS, { error: requiredMessage('method', 'a supported HTTP method') }),
    path: BuilderEndpointPath,
    statusCode: z
        .number({ error: requiredMessage('statusCode', 'a number') })
        .int()
        .refine((code): code is (typeof BUILDER_STATUS_CODES)[number] => (BUILDER_STATUS_CODES as readonly number[]).includes(code), {
            message: `statusCode must be one of: ${BUILDER_STATUS_CODES.join(', ')}`,
        }),
    requestBody: z.unknown().optional().default(null),
    responseBody: z.unknown().optional().default(null),
    responseHeaders: HeaderRecord.optional().default({}),
    delayMs: z.number().int().min(0).max(BUILDER_LIMITS.maxDelayMs).optional().default(0),
    description: z.string().trim().max(BUILDER_LIMITS.maxDescriptionLength).optional().default(''),
    enabled: z.boolean().optional().default(true),
};

const isJsonObjectOrArray = (value: unknown) => typeof value === 'object' && value !== null;

const refineJsonBodies = <T extends { method?: string; requestBody?: unknown; responseBody?: unknown }>(value: T, ctx: z.RefinementCtx) => {
    const method = value.method;
    const needsRequestBody = method !== undefined && method !== 'GET';

    if (method === 'GET' && value.requestBody != null) {
        ctx.addIssue({
            code: 'custom',
            path: ['requestBody'],
            message: 'requestBody is not allowed for GET endpoints',
        });
    }

    if (needsRequestBody) {
        if (value.requestBody === undefined || value.requestBody === null) {
            ctx.addIssue({
                code: 'custom',
                path: ['requestBody'],
                message: 'requestBody is required and must be a valid JSON object or array',
            });
        } else if (!isJsonObjectOrArray(value.requestBody)) {
            ctx.addIssue({
                code: 'custom',
                path: ['requestBody'],
                message: 'requestBody must be a valid JSON object or array',
            });
        }
    } else if (value.requestBody != null && !isJsonObjectOrArray(value.requestBody)) {
        ctx.addIssue({
            code: 'custom',
            path: ['requestBody'],
            message: 'requestBody must be a valid JSON object or array',
        });
    }

    if (value.responseBody != null && !isJsonObjectOrArray(value.responseBody) && typeof value.responseBody !== 'string' && typeof value.responseBody !== 'number' && typeof value.responseBody !== 'boolean') {
        ctx.addIssue({
            code: 'custom',
            path: ['responseBody'],
            message: 'responseBody must be valid JSON',
        });
    }

    const responseSize = jsonBodySize(value.responseBody);
    if (responseSize > BUILDER_LIMITS.maxResponseBodyBytes) {
        ctx.addIssue({
            code: 'custom',
            path: ['responseBody'],
            message: `responseBody must be at most ${BUILDER_LIMITS.maxResponseBodyBytes} bytes when serialized (got ${responseSize})`,
        });
    }

    const requestSize = jsonBodySize(value.requestBody);
    if (requestSize > BUILDER_LIMITS.maxResponseBodyBytes) {
        ctx.addIssue({
            code: 'custom',
            path: ['requestBody'],
            message: `requestBody must be at most ${BUILDER_LIMITS.maxResponseBodyBytes} bytes when serialized (got ${requestSize})`,
        });
    }
};

export const BuilderEndpointBody = z.object(BuilderEndpointFields).superRefine(refineJsonBodies);
export type BuilderEndpointBody = z.infer<typeof BuilderEndpointBody>;

export const BuilderEndpointPatchBody = z
    .object({
        method: BuilderEndpointFields.method.optional(),
        path: BuilderEndpointFields.path.optional(),
        statusCode: BuilderEndpointFields.statusCode.optional(),
        requestBody: z.unknown().optional(),
        responseBody: z.unknown().optional(),
        responseHeaders: HeaderRecord.optional(),
        delayMs: z.number().int().min(0).max(BUILDER_LIMITS.maxDelayMs).optional(),
        description: z.string().trim().max(BUILDER_LIMITS.maxDescriptionLength).optional(),
        enabled: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' })
    .superRefine(refineJsonBodies);
export type BuilderEndpointPatchBody = z.infer<typeof BuilderEndpointPatchBody>;

export const BuilderProjectCreateBody = z.object({
    name: z.string({ error: requiredMessage('name', 'a string') }).trim().min(1).max(BUILDER_LIMITS.maxNameLength),
    description: z.string().trim().max(BUILDER_LIMITS.maxDescriptionLength).optional().default(''),
    enabled: z.boolean().optional().default(true),
});
export type BuilderProjectCreateBody = z.infer<typeof BuilderProjectCreateBody>;

export const BuilderProjectUpdateBody = z
    .object({
        name: z.string().trim().min(1).max(BUILDER_LIMITS.maxNameLength).optional(),
        description: z.string().trim().max(BUILDER_LIMITS.maxDescriptionLength).optional(),
        enabled: z.boolean().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });
export type BuilderProjectUpdateBody = z.infer<typeof BuilderProjectUpdateBody>;

export const BuilderEndpointSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    method: z.enum(BUILDER_HTTP_METHODS),
    path: z.string(),
    statusCode: z.number().int(),
    requestBody: z.unknown(),
    responseBody: z.unknown(),
    responseHeaders: z.record(z.string(), z.string()),
    delayMs: z.number().int().min(0),
    description: z.string(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type BuilderEndpoint = z.infer<typeof BuilderEndpointSchema>;

export const BuilderProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    enabled: z.boolean(),
    basePath: z.string(),
    endpointCount: z.number().int().nonnegative(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export type BuilderProject = z.infer<typeof BuilderProjectSchema>;

export const BuilderProjectDetailSchema = BuilderProjectSchema.extend({
    endpoints: z.array(BuilderEndpointSchema),
});
export type BuilderProjectDetail = z.infer<typeof BuilderProjectDetailSchema>;
