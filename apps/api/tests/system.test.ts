import { describe, expect, it } from 'vitest';
import { endpoints, RESOURCE_KEYS } from '@mockapis/api-spec';
import { api, expectError } from './helpers';

describe('system endpoints', () => {
    it('GET /health returns ok with database state', async () => {
        const response = await api().get('/health');
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ status: 'ok', database: 'connected' });
        expect(response.headers['cache-control']).toBe('no-store');
    });

    it('GET /ready returns ready when the database is seeded', async () => {
        const response = await api().get('/ready');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ready', database: 'connected' });
    });

    it('GET /api/v1 lists every resource and documentation links', async () => {
        const response = await api().get('/api/v1');
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Mock APIs');
        expect(response.body.baseUrl).toBe('http://localhost:4000/api/v1');
        expect(response.body.resources.map((resource: { name: string }) => resource.name)).toEqual([...RESOURCE_KEYS]);
        expect(response.body.documentation.openapi).toBe('http://localhost:4000/openapi.json');
        expect(response.body.limits).toMatchObject({ defaultPageSize: 30, maxPageSize: 100, maxDelayMs: 5000 });
    });

    it('GET /openapi.json serves an OpenAPI 3 document covering every documented endpoint', async () => {
        const response = await api().get('/openapi.json');
        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe('3.0.3');
        expect(response.body.servers[0].url).toBe('http://localhost:4000');
        for (const endpoint of endpoints) {
            expect(response.body.paths[endpoint.path], endpoint.path).toHaveProperty(endpoint.method.toLowerCase());
        }
        expect(response.body.components.schemas).toHaveProperty('User');
        expect(response.body.components.schemas).toHaveProperty('Error');
    });

    it('serves Swagger UI at /docs', async () => {
        const response = await api().get('/docs/');
        expect(response.status).toBe(200);
        expect(response.text).toContain('swagger-ui');
    });

    it('unknown routes return a structured 404', async () => {
        const response = await api().get('/api/v1/unicorns');
        expectError(response, 404, 'ROUTE_NOT_FOUND');
    });

    it('unsupported methods on known routes return 405 with an Allow header', async () => {
        const response = await api().delete('/api/v1/quotes/1');
        expectError(response, 405, 'METHOD_NOT_ALLOWED');
        expect(response.headers.allow).toContain('GET');
    });

    it('assigns a request ID per request and honors a valid incoming one', async () => {
        const first = await api().get('/health');
        const second = await api().get('/health');
        expect(first.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
        expect(first.headers['x-request-id']).not.toBe(second.headers['x-request-id']);

        const custom = await api().get('/api/v1/users/999999').set('X-Request-Id', 'my-trace-12345');
        expect(custom.headers['x-request-id']).toBe('my-trace-12345');
        expect(custom.body.requestId).toBe('my-trace-12345');

        const unsafe = await api().get('/health').set('X-Request-Id', '<script>alert(1)</script>');
        expect(unsafe.headers['x-request-id']).not.toContain('<');
    });

    it('reports response time', async () => {
        const response = await api().get('/api/v1/users/1');
        expect(response.headers['x-response-time']).toMatch(/^\d+(\.\d+)?ms$/);
    });
});
