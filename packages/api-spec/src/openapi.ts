import { z } from 'zod';
import { API_NAME, API_VERSION } from './constants';
import { endpoints, type DocSection, type EndpointDoc } from './endpoints';
import { getExamples } from './examples';
import { resourceList, resources, type ResourceKey } from './resources';
import { ErrorSchema } from './schemas';

type JsonObject = Record<string, unknown>;

export const SECTION_LABELS: Record<DocSection, string> = {
    users: 'Users',
    products: 'Products',
    posts: 'Posts',
    comments: 'Comments',
    todos: 'Todos',
    carts: 'Carts',
    recipes: 'Recipes',
    quotes: 'Quotes',
    auth: 'Authentication',
    testing: 'HTTP Testing',
    system: 'System',
};

const componentName = (key: ResourceKey) => resources[key].singular.charAt(0).toUpperCase() + resources[key].singular.slice(1);

function toJsonSchema(schema: z.ZodType, io: 'input' | 'output'): JsonObject {
    const json = z.toJSONSchema(schema, { target: 'openapi-3.0', unrepresentable: 'any', io }) as JsonObject;
    delete json.$schema;
    return json;
}

function successSchema(endpoint: EndpointDoc): JsonObject | undefined {
    const resourceKey = endpoint.section as ResourceKey;
    const isResource = resourceKey in resources;
    const relation = isResource ? resources[resourceKey].relations.find((rel) => endpoint.id === `${resourceKey}.${rel.path}`) : undefined;
    const listKey = relation?.resource ?? (isResource ? resourceKey : undefined);

    if (listKey && (endpoint.id.endsWith('.list') || endpoint.id.endsWith('.search') || endpoint.id === 'products.byCategory' || relation)) {
        return {
            type: 'object',
            required: [listKey, 'total', 'skip', 'limit'],
            properties: {
                [listKey]: { type: 'array', items: { $ref: `#/components/schemas/${componentName(listKey)}` } },
                total: { type: 'integer', description: 'Total number of matching records.' },
                skip: { type: 'integer' },
                limit: { type: 'integer' },
            },
        };
    }
    if (isResource && (endpoint.id.endsWith('.get') || endpoint.id === 'quotes.random')) {
        return { $ref: `#/components/schemas/${componentName(resourceKey)}` };
    }
    if (endpoint.responseSchema) {
        return toJsonSchema(endpoint.responseSchema, 'output');
    }
    return undefined;
}

function buildOperation(endpoint: EndpointDoc): JsonObject {
    const examples = getExamples(endpoint.id);
    const responses: JsonObject = {};

    for (const response of endpoint.responses) {
        const isSuccess = response.status === endpoint.successStatus;
        const isFailure = response.status === endpoint.failureStatus;
        const captured = isSuccess ? examples?.success : isFailure ? examples?.failure : undefined;

        if (response.status === 204) {
            responses[String(response.status)] = { description: response.description };
            continue;
        }
        if (response.status < 400) {
            const contentType = endpoint.responseContentType ?? 'application/json';
            const schema = contentType === 'application/json' ? successSchema(endpoint) : { type: 'string' };
            responses[String(response.status)] = {
                description: response.description,
                content: {
                    [contentType]: {
                        schema: schema ?? { type: 'object' },
                        ...(captured && contentType === 'application/json' ? { example: captured.body } : {}),
                    },
                },
            };
            continue;
        }
        responses[String(response.status)] = {
            description: response.description,
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Error' },
                    ...(captured ? { example: captured.body } : {}),
                },
            },
        };
    }

    const operation: JsonObject = {
        operationId: endpoint.id.replace(/\.(\w)/g, (_, char: string) => char.toUpperCase()),
        summary: endpoint.summary,
        description: endpoint.simulated
            ? `${endpoint.description}\n\n**Simulated:** this operation never modifies the shared dataset. Responses include the \`X-MockAPIs-Simulated: true\` header.`
            : endpoint.description,
        tags: [SECTION_LABELS[endpoint.section]],
        parameters: endpoint.params
            .filter((param) => !(param.in === 'header' && param.name === 'Authorization'))
            .map((param) => ({
                name: param.name,
                in: param.in,
                required: param.required,
                description: param.description,
                schema: {
                    type: param.type,
                    ...(param.enum ? { enum: param.type === 'integer' ? param.enum.map(Number) : param.enum } : {}),
                    ...(param.default !== undefined ? { default: param.default } : {}),
                    ...(param.minimum !== undefined ? { minimum: param.minimum } : {}),
                    ...(param.maximum !== undefined ? { maximum: param.maximum } : {}),
                },
                ...(param.example !== undefined ? { example: param.type === 'integer' || param.type === 'number' ? Number(param.example) : param.example } : {}),
            })),
        responses,
    };

    if (endpoint.requestBody) {
        operation.requestBody = {
            required: true,
            description: endpoint.requestBody.description,
            content: {
                'application/json': {
                    schema: toJsonSchema(endpoint.requestBody.schema, 'input'),
                    example: endpoint.requestBody.example,
                },
            },
        };
    }
    if (endpoint.requiresAuth) {
        operation.security = [{ demoBearer: [] }];
    }
    return operation;
}

export interface OpenApiOptions {
    serverUrl: string;
}

export function buildOpenApiDocument({ serverUrl }: OpenApiOptions): JsonObject {
    const paths: Record<string, JsonObject> = {};
    for (const endpoint of endpoints) {
        paths[endpoint.path] ??= {};
        paths[endpoint.path][endpoint.method.toLowerCase()] = buildOperation(endpoint);
    }

    const schemas: JsonObject = { Error: toJsonSchema(ErrorSchema, 'output') };
    for (const resource of resourceList) {
        schemas[componentName(resource.key)] = toJsonSchema(resource.schema, 'output');
    }

    const usedSections = new Set(endpoints.map((endpoint) => endpoint.section));
    return {
        openapi: '3.0.3',
        info: {
            title: API_NAME,
            version: API_VERSION,
            description:
                'Free REST APIs for learning, building, and testing. No API key required. Mutating requests (POST, PUT, PATCH, DELETE) are simulated and never change the shared dataset. Demo authentication is for practice only and must not be used to secure real applications.',
            license: { name: 'MIT' },
        },
        servers: [{ url: serverUrl.replace(/\/$/, '') }],
        tags: [...usedSections].map((section) => ({ name: SECTION_LABELS[section] })),
        paths,
        components: {
            schemas,
            securitySchemes: {
                demoBearer: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Demo access token from POST /api/v1/auth/login. For practice only.',
                },
            },
        },
    };
}
