import { z } from 'zod';
import { ALLOWED_TEST_STATUS_CODES, API_PREFIX, DEMO_CREDENTIALS, MAX_DELAY_MS, PAGINATION } from './constants';
import { resourceList, resources, type ResourceConfig, type ResourceKey } from './resources';
import { AuthResponseSchema, AuthUserSchema, LoginBody, RefreshBody, RegisterBody } from './schemas';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type EndpointGroup = 'Data' | 'CRUD' | 'Authentication' | 'Testing' | 'System';
export type DocSection = ResourceKey | 'auth' | 'testing' | 'system';

export interface ParamDoc {
    name: string;
    in: 'path' | 'query' | 'header';
    required: boolean;
    type: 'integer' | 'number' | 'string' | 'boolean';
    description: string;
    example?: string;
    enum?: readonly string[];
    default?: string | number | boolean;
    minimum?: number;
    maximum?: number;
}

export interface ExampleRequest {
    /** Concrete path including the `/api/v1` prefix, e.g. `/api/v1/users/1`. */
    path: string;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    body?: unknown;
}

export interface ResponseDoc {
    status: number;
    description: string;
}

export interface EndpointDoc {
    id: string;
    method: HttpMethod;
    /** OpenAPI-style path template, e.g. `/api/v1/users/{id}`. */
    path: string;
    section: DocSection;
    group: EndpointGroup;
    summary: string;
    description: string;
    params: ParamDoc[];
    requestBody?: { description: string; schema: z.ZodType; example: unknown };
    /** Schema of the success response body (omitted for 204 and non-JSON responses). */
    responseSchema?: z.ZodType;
    responseContentType?: string;
    requiresAuth?: boolean;
    simulated?: boolean;
    example: ExampleRequest;
    failure?: ExampleRequest;
    successStatus: number;
    failureStatus?: number;
    responses: ResponseDoc[];
}

/** Placeholders substituted with real demo tokens by the docs "Try it" panel, tests, and example capture. */
export const TOKEN_PLACEHOLDERS = {
    accessToken: '{{accessToken}}',
    refreshToken: '{{refreshToken}}',
} as const;

const p = (path: string) => `${API_PREFIX}${path}`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const AUTH_HEADERS = { Authorization: `Bearer ${TOKEN_PLACEHOLDERS.accessToken}` };

const idParam = (resource: ResourceConfig): ParamDoc => ({
    name: 'id',
    in: 'path',
    required: true,
    type: 'integer',
    description: `Numeric ${resource.singular} ID (positive integer).`,
    example: '1',
    minimum: 1,
});

const delayParam: ParamDoc = {
    name: 'delay',
    in: 'query',
    required: false,
    type: 'integer',
    description: `Delay the response by this many milliseconds (0-${MAX_DELAY_MS}). Subject to a stricter rate limit.`,
    example: '1000',
    minimum: 0,
    maximum: MAX_DELAY_MS,
};

const selectParam = (resource: ResourceConfig): ParamDoc => ({
    name: 'select',
    in: 'query',
    required: false,
    type: 'string',
    description: `Comma-separated list of fields to return. \`id\` is always included. Allowed: ${resource.fields.join(', ')}.`,
    example: resource.fields.slice(0, 3).join(','),
});

const paginationParams: ParamDoc[] = [
    {
        name: 'limit',
        in: 'query',
        required: false,
        type: 'integer',
        description: `Number of records to return (1-${PAGINATION.maxLimit}).`,
        default: PAGINATION.defaultLimit,
        example: '10',
        minimum: 1,
        maximum: PAGINATION.maxLimit,
    },
    {
        name: 'skip',
        in: 'query',
        required: false,
        type: 'integer',
        description: 'Number of records to skip before returning results.',
        default: 0,
        example: '0',
        minimum: 0,
        maximum: PAGINATION.maxSkip,
    },
];

const sortParams = (resource: ResourceConfig): ParamDoc[] => [
    {
        name: 'sortBy',
        in: 'query',
        required: false,
        type: 'string',
        description: 'Field to sort by.',
        enum: resource.sortable,
        default: 'id',
        example: resource.sortable[1] ?? 'id',
    },
    {
        name: 'order',
        in: 'query',
        required: false,
        type: 'string',
        description: 'Sort direction.',
        enum: ['asc', 'desc'],
        default: 'asc',
        example: 'desc',
    },
];

export const listQueryParams = (resource: ResourceConfig, includeFilters = true): ParamDoc[] => [
    ...paginationParams,
    selectParam(resource),
    ...sortParams(resource),
    ...(includeFilters
        ? resource.filters.map<ParamDoc>((filter) => ({
              name: filter.name,
              in: 'query',
              required: false,
              type: filter.type === 'enum' ? 'string' : filter.type,
              description: filter.description,
              example: filter.example,
              enum: filter.values,
          }))
        : []),
    delayParam,
];

const commonErrors = {
    badRequest: { status: 400, description: 'Invalid path or query parameter (`INVALID_PARAMETER` / `INVALID_ID`).' },
    notFound: { status: 404, description: 'No record exists with that ID (`RESOURCE_NOT_FOUND`).' },
    validation: { status: 422, description: 'The JSON body failed validation (`VALIDATION_ERROR`).' },
    invalidJson: { status: 400, description: 'The request body is not valid JSON (`INVALID_JSON`).' },
    rateLimited: { status: 429, description: 'Too many requests from this IP (`RATE_LIMIT_EXCEEDED`).' },
    unavailable: { status: 503, description: 'The database is temporarily unavailable (`SERVICE_UNAVAILABLE`).' },
};

export const listResponseSchema = (resource: ResourceConfig) =>
    z.object({
        [resource.key]: z.array(resource.schema.partial().required({ id: true } as never)),
        total: z.number().int(),
        skip: z.number().int(),
        limit: z.number().int(),
    });

const detailResponseSchema = (resource: ResourceConfig) => resource.schema.partial().required({ id: true } as never);

function resourceEndpoints(resource: ResourceConfig): EndpointDoc[] {
    const { key, singular, label } = resource;
    const docs: EndpointDoc[] = [];

    docs.push({
        id: `${key}.list`,
        method: 'GET',
        path: p(`/${key}`),
        section: key,
        group: 'Data',
        summary: `List ${key}`,
        description: `Returns a paginated list of ${key}. Supports pagination, field selection, sorting, and filtering.`,
        params: listQueryParams(resource),
        responseSchema: listResponseSchema(resource),
        example: { path: p(`/${key}`), query: { limit: '2' } },
        failure: { path: p(`/${key}`), query: { limit: '1000' } },
        successStatus: 200,
        failureStatus: 400,
        responses: [
            { status: 200, description: `A page of ${key} with \`total\`, \`skip\`, and \`limit\` metadata.` },
            commonErrors.badRequest,
            commonErrors.rateLimited,
            commonErrors.unavailable,
        ],
    });

    if (resource.searchable.length > 0) {
        docs.push({
            id: `${key}.search`,
            method: 'GET',
            path: p(`/${key}/search`),
            section: key,
            group: 'Data',
            summary: `Search ${key}`,
            description: `Case-insensitive search across ${resource.searchable.join(', ')}. Returns an empty \`${key}\` array with \`total: 0\` when nothing matches.`,
            params: [
                {
                    name: 'q',
                    in: 'query',
                    required: true,
                    type: 'string',
                    description: 'Search term (1-100 characters).',
                    example: resource.examples.search,
                },
                ...listQueryParams(resource, false),
            ],
            responseSchema: listResponseSchema(resource),
            example: { path: p(`/${key}/search`), query: { q: resource.examples.search ?? 'a', limit: '2' } },
            failure: { path: p(`/${key}/search`) },
            successStatus: 200,
            failureStatus: 400,
            responses: [
                { status: 200, description: `Matching ${key} (possibly empty).` },
                { status: 400, description: 'Missing or invalid `q` parameter (`INVALID_PARAMETER`).' },
                commonErrors.rateLimited,
            ],
        });
    }

    docs.push({
        id: `${key}.get`,
        method: 'GET',
        path: p(`/${key}/{id}`),
        section: key,
        group: 'Data',
        summary: `Get a ${singular}`,
        description: `Returns a single ${singular} by its numeric ID.`,
        params: [idParam(resource), selectParam(resource), delayParam],
        responseSchema: detailResponseSchema(resource),
        example: { path: p(`/${key}/1`) },
        failure: { path: p(`/${key}/999999`) },
        successStatus: 200,
        failureStatus: 404,
        responses: [{ status: 200, description: `The ${singular} object.` }, commonErrors.badRequest, commonErrors.notFound],
    });

    for (const relation of resource.relations) {
        const target = resources[relation.resource];
        docs.push({
            id: `${key}.${relation.path}`,
            method: 'GET',
            path: p(`/${key}/{id}/${relation.path}`),
            section: key,
            group: 'Data',
            summary: `List a ${singular}'s ${relation.path}`,
            description: `Returns ${relation.path} whose \`${relation.foreignKey}\` matches the ${singular} ID. Returns 404 if the ${singular} does not exist.`,
            params: [idParam(resource), ...listQueryParams(target, false)],
            responseSchema: listResponseSchema(target),
            example: { path: p(`/${key}/1/${relation.path}`), query: { limit: '2' } },
            failure: { path: p(`/${key}/999999/${relation.path}`) },
            successStatus: 200,
            failureStatus: 404,
            responses: [
                { status: 200, description: `A page of ${relation.path}.` },
                commonErrors.badRequest,
                { status: 404, description: `The ${singular} does not exist (\`RESOURCE_NOT_FOUND\`).` },
            ],
        });
    }

    if (resource.mutable && resource.bodies) {
        const { examples, bodies } = resource;
        docs.push({
            id: `${key}.create`,
            method: 'POST',
            path: p(`/${key}`),
            section: key,
            group: 'CRUD',
            summary: `Create a ${singular} (simulated)`,
            description: `Validates the body and returns the ${singular} as it would be created, with the next available ID. Nothing is persisted: the shared dataset is never modified.`,
            params: [],
            requestBody: { description: `${label} fields.`, schema: bodies.create, example: examples.createBody },
            simulated: true,
            example: { path: p(`/${key}`), headers: JSON_HEADERS, body: examples.createBody },
            failure: { path: p(`/${key}`), headers: JSON_HEADERS, body: {} },
            successStatus: 201,
            failureStatus: 422,
            responses: [
                { status: 201, description: `The simulated ${singular}, including its new \`id\`.` },
                commonErrors.invalidJson,
                ...(key === 'users' ? [{ status: 409, description: 'The email or username is already used by a seeded user (`CONFLICT`).' }] : []),
                commonErrors.validation,
            ],
        });
        docs.push({
            id: `${key}.replace`,
            method: 'PUT',
            path: p(`/${key}/{id}`),
            section: key,
            group: 'CRUD',
            summary: `Replace a ${singular} (simulated)`,
            description: `Validates a complete replacement body and returns the resulting ${singular}. The stored record is not changed.`,
            params: [idParam(resource)],
            requestBody: { description: `Complete ${singular} representation.`, schema: bodies.replace, example: examples.replaceBody },
            simulated: true,
            example: { path: p(`/${key}/1`), headers: JSON_HEADERS, body: examples.replaceBody },
            failure: { path: p(`/${key}/999999`), headers: JSON_HEADERS, body: examples.replaceBody },
            successStatus: 200,
            failureStatus: 404,
            responses: [
                { status: 200, description: `The replaced ${singular}.` },
                commonErrors.badRequest,
                commonErrors.notFound,
                commonErrors.validation,
            ],
        });
        docs.push({
            id: `${key}.patch`,
            method: 'PATCH',
            path: p(`/${key}/{id}`),
            section: key,
            group: 'CRUD',
            summary: `Update a ${singular} (simulated)`,
            description: `Merges the provided fields into the existing ${singular} and returns the result. The stored record is not changed.`,
            params: [idParam(resource)],
            requestBody: { description: `Any subset of ${singular} fields.`, schema: bodies.patch, example: examples.patchBody },
            simulated: true,
            example: { path: p(`/${key}/1`), headers: JSON_HEADERS, body: examples.patchBody },
            failure: { path: p(`/${key}/1`), headers: JSON_HEADERS, body: { unknownField: true } },
            successStatus: 200,
            failureStatus: 422,
            responses: [
                { status: 200, description: `The updated ${singular}.` },
                commonErrors.badRequest,
                commonErrors.notFound,
                commonErrors.validation,
            ],
        });
        docs.push({
            id: `${key}.delete`,
            method: 'DELETE',
            path: p(`/${key}/{id}`),
            section: key,
            group: 'CRUD',
            summary: `Delete a ${singular} (simulated)`,
            description: `Returns \`204 No Content\` if the ${singular} exists. The record is not actually removed.`,
            params: [idParam(resource)],
            simulated: true,
            example: { path: p(`/${key}/1`) },
            failure: { path: p(`/${key}/999999`) },
            successStatus: 204,
            failureStatus: 404,
            responses: [{ status: 204, description: 'Empty body.' }, commonErrors.badRequest, commonErrors.notFound],
        });
    }

    return docs;
}

const products = resources.products;
const quotes = resources.quotes;

const specialEndpoints: EndpointDoc[] = [
    {
        id: 'root',
        method: 'GET',
        path: p(''),
        section: 'system',
        group: 'System',
        summary: 'API discovery',
        description: 'Lists available resources, documentation links, and pagination defaults.',
        params: [],
        example: { path: p('') },
        successStatus: 200,
        responses: [{ status: 200, description: 'API metadata and resource links.' }],
    },
    {
        id: 'products.categories',
        method: 'GET',
        path: p('/products/categories'),
        section: 'products',
        group: 'Data',
        summary: 'List product categories',
        description: 'Returns every product category with a display name and product count.',
        params: [delayParam],
        responseSchema: z.object({
            categories: z.array(z.object({ slug: z.string(), name: z.string(), productCount: z.number().int() })),
            total: z.number().int(),
        }),
        example: { path: p('/products/categories') },
        successStatus: 200,
        responses: [{ status: 200, description: 'All categories.' }],
    },
    {
        id: 'products.byCategory',
        method: 'GET',
        path: p('/products/category/{category}'),
        section: 'products',
        group: 'Data',
        summary: 'List products in a category',
        description: 'Returns products in the given category. Unknown categories return 404.',
        params: [
            { name: 'category', in: 'path', required: true, type: 'string', description: 'Category slug.', example: 'smartphones' },
            ...listQueryParams(products, false),
        ],
        responseSchema: listResponseSchema(products),
        example: { path: p('/products/category/smartphones'), query: { limit: '2' } },
        failure: { path: p('/products/category/time-machines') },
        successStatus: 200,
        failureStatus: 404,
        responses: [
            { status: 200, description: 'A page of products in the category.' },
            commonErrors.badRequest,
            { status: 404, description: 'Unknown category (`RESOURCE_NOT_FOUND`).' },
        ],
    },
    {
        id: 'quotes.random',
        method: 'GET',
        path: p('/quotes/random'),
        section: 'quotes',
        group: 'Data',
        summary: 'Get a random quote',
        description: 'Returns one randomly selected quote. This is the only intentionally non-deterministic endpoint.',
        params: [delayParam],
        responseSchema: quotes.schema,
        example: { path: p('/quotes/random') },
        successStatus: 200,
        responses: [{ status: 200, description: 'A quote object.' }],
    },
    {
        id: 'auth.login',
        method: 'POST',
        path: p('/auth/login'),
        section: 'auth',
        group: 'Authentication',
        summary: 'Log in (demo)',
        description:
            'Exchanges demo credentials for a short-lived demo access token and a refresh token. Use `username` or `email`. `expiresInMins` (1-1440) lets you practice token expiry.',
        params: [],
        requestBody: { description: 'Demo credentials.', schema: LoginBody, example: { ...DEMO_CREDENTIALS.admin, expiresInMins: 30 } },
        responseSchema: AuthResponseSchema,
        example: { path: p('/auth/login'), headers: JSON_HEADERS, body: { ...DEMO_CREDENTIALS.admin, expiresInMins: 30 } },
        failure: { path: p('/auth/login'), headers: JSON_HEADERS, body: { username: DEMO_CREDENTIALS.admin.username, password: 'wrong-password' } },
        successStatus: 200,
        failureStatus: 401,
        responses: [
            { status: 200, description: 'Tokens and the authenticated user.' },
            { status: 401, description: 'Wrong username/email or password (`INVALID_CREDENTIALS`).' },
            commonErrors.validation,
        ],
    },
    {
        id: 'auth.register',
        method: 'POST',
        path: p('/auth/register'),
        section: 'auth',
        group: 'Authentication',
        summary: 'Register (demo, simulated)',
        description:
            'Validates a registration request and returns tokens for a simulated new user. The account is not stored, but the returned access token works with `/auth/me` until it expires.',
        params: [],
        requestBody: {
            description: 'New account details.',
            schema: RegisterBody,
            example: { firstName: 'Jordan', lastName: 'Lee', username: 'jordanlee', email: 'jordan.lee@example.com', password: 'supersecret1' },
        },
        responseSchema: AuthResponseSchema,
        simulated: true,
        example: {
            path: p('/auth/register'),
            headers: JSON_HEADERS,
            body: { firstName: 'Jordan', lastName: 'Lee', username: 'jordanlee', email: 'jordan.lee@example.com', password: 'supersecret1' },
        },
        failure: {
            path: p('/auth/register'),
            headers: JSON_HEADERS,
            body: { firstName: 'Emily', lastName: 'Carter', username: DEMO_CREDENTIALS.admin.username, email: 'someone@example.com', password: 'supersecret1' },
        },
        successStatus: 201,
        failureStatus: 409,
        responses: [
            { status: 201, description: 'Tokens and the simulated user.' },
            { status: 409, description: 'Username or email already taken by a seeded user (`CONFLICT`).' },
            commonErrors.validation,
        ],
    },
    {
        id: 'auth.me',
        method: 'GET',
        path: p('/auth/me'),
        section: 'auth',
        group: 'Authentication',
        summary: 'Get the current user',
        description: 'Returns the user identified by the demo access token in the `Authorization: Bearer <token>` header.',
        params: [{ name: 'Authorization', in: 'header', required: true, type: 'string', description: '`Bearer <accessToken>` from login or register.', example: 'Bearer <accessToken>' }],
        requiresAuth: true,
        responseSchema: AuthUserSchema,
        example: { path: p('/auth/me'), headers: AUTH_HEADERS },
        failure: { path: p('/auth/me'), headers: { Authorization: 'Bearer not-a-real-token' } },
        successStatus: 200,
        failureStatus: 401,
        responses: [
            { status: 200, description: 'The authenticated user.' },
            {
                status: 401,
                description: 'Missing header (`MISSING_TOKEN`), malformed header (`INVALID_AUTH_HEADER`), invalid token (`INVALID_TOKEN`), or expired token (`TOKEN_EXPIRED`).',
            },
        ],
    },
    {
        id: 'auth.refresh',
        method: 'POST',
        path: p('/auth/refresh'),
        section: 'auth',
        group: 'Authentication',
        summary: 'Refresh tokens',
        description: 'Exchanges a valid refresh token for a new access token and refresh token.',
        params: [],
        requestBody: { description: 'The refresh token from login.', schema: RefreshBody, example: { refreshToken: TOKEN_PLACEHOLDERS.refreshToken, expiresInMins: 30 } },
        responseSchema: AuthResponseSchema,
        example: { path: p('/auth/refresh'), headers: JSON_HEADERS, body: { refreshToken: TOKEN_PLACEHOLDERS.refreshToken, expiresInMins: 30 } },
        failure: { path: p('/auth/refresh'), headers: JSON_HEADERS, body: { refreshToken: 'invalid-refresh-token' } },
        successStatus: 200,
        failureStatus: 401,
        responses: [
            { status: 200, description: 'New tokens and the user.' },
            { status: 401, description: 'Invalid or expired refresh token (`INVALID_TOKEN` / `TOKEN_EXPIRED`).' },
            commonErrors.validation,
        ],
    },
    {
        id: 'auth.admin',
        method: 'GET',
        path: p('/auth/admin'),
        section: 'auth',
        group: 'Authentication',
        summary: 'Admin-only route',
        description: `Practice role-based authorization. Returns 200 for users with the \`admin\` role and 403 for everyone else. Log in as \`${DEMO_CREDENTIALS.user.username}\` to see a 403.`,
        params: [{ name: 'Authorization', in: 'header', required: true, type: 'string', description: '`Bearer <accessToken>`.', example: 'Bearer <accessToken>' }],
        requiresAuth: true,
        example: { path: p('/auth/admin'), headers: AUTH_HEADERS },
        failure: { path: p('/auth/admin') },
        successStatus: 200,
        failureStatus: 401,
        responses: [
            { status: 200, description: 'Access granted.' },
            { status: 401, description: 'Missing or invalid token.' },
            { status: 403, description: 'Authenticated, but not an admin (`FORBIDDEN`).' },
        ],
    },
    {
        id: 'testing.echo',
        method: 'POST',
        path: p('/test/echo'),
        section: 'testing',
        group: 'Testing',
        summary: 'Echo the request',
        description:
            'Returns the method, path, query parameters, safe request headers, and JSON body you sent. Any query parameters are accepted. The body is optional and must be a JSON object or array. Authorization headers, cookies, API keys, and sensitive body fields are redacted.',
        params: [],
        requestBody: { description: 'Any JSON object or array.', schema: z.unknown(), example: { message: 'Hello, Mock APIs!', count: 3 } },
        example: { path: p('/test/echo'), query: { source: 'docs' }, headers: { ...JSON_HEADERS, 'X-Custom-Header': 'demo' }, body: { message: 'Hello, Mock APIs!', count: 3 } },
        failure: { path: p('/test/echo'), headers: JSON_HEADERS, body: '{"broken": ' },
        successStatus: 200,
        failureStatus: 400,
        responses: [{ status: 200, description: 'The echoed request.' }, commonErrors.invalidJson, { status: 413, description: 'Body larger than the size limit (`PAYLOAD_TOO_LARGE`).' }],
    },
    {
        id: 'testing.delay',
        method: 'GET',
        path: p('/test/delay'),
        section: 'testing',
        group: 'Testing',
        summary: 'Delayed response',
        description: `Waits \`ms\` milliseconds (0-${MAX_DELAY_MS}) before responding. Great for testing loading states and client timeouts.`,
        params: [{ name: 'ms', in: 'query', required: true, type: 'integer', description: `Delay in milliseconds (0-${MAX_DELAY_MS}).`, example: '1000', minimum: 0, maximum: MAX_DELAY_MS }],
        responseSchema: z.object({ delayedMs: z.number().int(), message: z.string() }),
        example: { path: p('/test/delay'), query: { ms: '500' } },
        failure: { path: p('/test/delay'), query: { ms: '10000' } },
        successStatus: 200,
        failureStatus: 400,
        responses: [{ status: 200, description: 'Sent after the delay.' }, { status: 400, description: 'Missing or out-of-range `ms` (`INVALID_PARAMETER`).' }, commonErrors.rateLimited],
    },
    {
        id: 'testing.status',
        method: 'GET',
        path: p('/test/status/{code}'),
        section: 'testing',
        group: 'Testing',
        summary: 'Respond with a status code',
        description: `Responds with the requested HTTP status code. Allowed codes: ${ALLOWED_TEST_STATUS_CODES.join(', ')}. Error codes use the standard error body with code \`SIMULATED_STATUS\`; 204 has an empty body.`,
        params: [{ name: 'code', in: 'path', required: true, type: 'integer', description: 'One of the allowed status codes.', example: '404', enum: ALLOWED_TEST_STATUS_CODES.map(String) }],
        example: { path: p('/test/status/200') },
        failure: { path: p('/test/status/404') },
        successStatus: 200,
        failureStatus: 404,
        responses: [
            { status: 200, description: 'Simulated success.' },
            { status: 400, description: 'The code is not in the allowed list (`INVALID_PARAMETER`).' },
            { status: 404, description: 'Simulated error (any allowed 4xx/5xx code).' },
        ],
    },
    {
        id: 'images.get',
        method: 'GET',
        path: p('/images/{type}/{id}'),
        section: 'system',
        group: 'System',
        summary: 'Placeholder image (SVG)',
        description: 'Deterministic SVG placeholder used by the `image` and `thumbnail` fields of users, products, and recipes.',
        params: [
            { name: 'type', in: 'path', required: true, type: 'string', description: 'Image type.', enum: ['users', 'products', 'recipes'], example: 'users' },
            { name: 'id', in: 'path', required: true, type: 'integer', description: 'Record ID.', example: '1', minimum: 1 },
        ],
        responseContentType: 'image/svg+xml',
        example: { path: p('/images/users/1') },
        failure: { path: p('/images/users/999999') },
        successStatus: 200,
        failureStatus: 404,
        responses: [{ status: 200, description: 'An SVG image.' }, commonErrors.badRequest, commonErrors.notFound],
    },
    {
        id: 'system.health',
        method: 'GET',
        path: '/health',
        section: 'system',
        group: 'System',
        summary: 'Health check (liveness)',
        description: 'Always returns 200 while the process is running, with the current database connection state.',
        params: [],
        example: { path: '/health' },
        successStatus: 200,
        responses: [{ status: 200, description: 'The service is running.' }],
    },
    {
        id: 'system.ready',
        method: 'GET',
        path: '/ready',
        section: 'system',
        group: 'System',
        summary: 'Readiness check',
        description: 'Returns 200 when the database is connected and seeded, otherwise 503.',
        params: [],
        example: { path: '/ready' },
        successStatus: 200,
        responses: [{ status: 200, description: 'Ready to serve traffic.' }, { status: 503, description: 'Not ready (`SERVICE_UNAVAILABLE`).' }],
    },
    {
        id: 'system.openapi',
        method: 'GET',
        path: '/openapi.json',
        section: 'system',
        group: 'System',
        summary: 'OpenAPI specification',
        description: 'The OpenAPI 3.0 document for this API. Import it into Postman, Insomnia, or code generators.',
        params: [],
        example: { path: '/openapi.json' },
        successStatus: 200,
        responses: [{ status: 200, description: 'OpenAPI JSON document.' }],
    },
];

export const endpoints: EndpointDoc[] = [
    specialEndpoints[0],
    ...resourceList.flatMap((resource) => {
        const generated = resourceEndpoints(resource);
        const extras = specialEndpoints.filter((endpoint) => endpoint.section === resource.key);
        // Place extra read endpoints right after the generated "search"/"list" entries.
        const insertAt = generated.findIndex((endpoint) => endpoint.id === `${resource.key}.get`);
        return [...generated.slice(0, insertAt), ...extras, ...generated.slice(insertAt)];
    }),
    ...specialEndpoints.filter((endpoint) => ['auth', 'testing'].includes(endpoint.section)),
    ...specialEndpoints.filter((endpoint) => endpoint.section === 'system' && endpoint.id !== 'root'),
];

export const getEndpoint = (id: string) => endpoints.find((endpoint) => endpoint.id === id);

export const endpointsBySection = (section: DocSection) => endpoints.filter((endpoint) => endpoint.section === section);

/** Builds the concrete URL path + query string of an example request. */
export function exampleUrl(example: ExampleRequest): string {
    const query = new URLSearchParams(example.query ?? {}).toString();
    return query ? `${example.path}?${query}` : example.path;
}
