import type { Express } from 'express';
import request from 'supertest';
import { DEMO_CREDENTIALS, TOKEN_PLACEHOLDERS, type CapturedResponse, type EndpointDoc, type ExampleRequest } from '@mockapis/api-spec';

export const EXAMPLE_BASE_URL = 'http://localhost:4000';
const EXAMPLE_HOST = 'localhost:4000';
const PLACEHOLDER_REQUEST_ID = '6f1c2a9e-3b7d-4c51-9a0e-2d8f4b6c1e73';
const PLACEHOLDER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-payload.demo-signature';

/** Endpoints whose bodies legitimately change between calls; only their status is compared. */
export const NON_DETERMINISTIC = new Set(['quotes.random', 'system.health', 'system.openapi']);

type Tokens = { accessToken: string; refreshToken: string };

export async function demoTokens(app: Express): Promise<Tokens> {
    const response = await request(app).post('/api/v1/auth/login').send(DEMO_CREDENTIALS.admin);
    if (response.status !== 200) throw new Error(`Demo login failed with ${response.status}`);
    return { accessToken: response.body.accessToken, refreshToken: response.body.refreshToken };
}

const substitute = (value: unknown, tokens: Tokens): unknown => {
    if (typeof value === 'string') {
        return value.replace(TOKEN_PLACEHOLDERS.accessToken, tokens.accessToken).replace(TOKEN_PLACEHOLDERS.refreshToken, tokens.refreshToken);
    }
    if (Array.isArray(value)) return value.map((item) => substitute(item, tokens));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, substitute(inner, tokens)]));
    return value;
};

export async function runExample(app: Express, endpoint: EndpointDoc, example: ExampleRequest, tokens: Tokens): Promise<CapturedResponse> {
    const resolved = substitute(example, tokens) as ExampleRequest;
    const method = endpoint.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    let call = request(app)[method](resolved.path).query(resolved.query ?? {}).set('Host', EXAMPLE_HOST).set('User-Agent', 'curl/8.7.1').set('Accept', '*/*');
    for (const [name, value] of Object.entries(resolved.headers ?? {})) call = call.set(name, value);
    if (resolved.body !== undefined) {
        call = call.send(typeof resolved.body === 'string' ? resolved.body : JSON.stringify(resolved.body));
    }

    const response = await call;
    const contentType = (response.headers['content-type'] as string | undefined)?.split(';')[0] ?? null;
    let body: unknown = null;
    if (contentType === 'application/json') body = response.body;
    else if (response.text) body = response.text;
    return { status: response.status, contentType, body };
}

/** Replaces volatile values (request IDs, tokens, timestamps) so captured examples are stable. */
export function normalize(endpointId: string, captured: CapturedResponse): CapturedResponse {
    const walk = (value: unknown, key?: string): unknown => {
        if (Array.isArray(value)) return value.map((item) => walk(item));
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([innerKey, inner]) => [innerKey, walk(inner, innerKey)]));
        if (key === 'requestId') return PLACEHOLDER_REQUEST_ID;
        if ((key === 'accessToken' || key === 'refreshToken') && typeof value === 'string') return PLACEHOLDER_TOKEN;
        if (key === 'uptimeSeconds') return 42;
        if (key === 'startedAt') return '2026-01-01T00:00:00.000Z';
        if (key === 'content-length') return '<length>';
        return value;
    };
    const body = endpointId === 'system.openapi' ? { note: 'The full OpenAPI document is returned. Download it from /openapi.json.' } : walk(captured.body);
    return { ...captured, body };
}
