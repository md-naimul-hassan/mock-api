import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument, endpoints, RESOURCE_KEYS, resources } from './index';

describe('endpoint registry', () => {
    it('has unique ids and unique method + path pairs', () => {
        const ids = endpoints.map((endpoint) => endpoint.id);
        expect(new Set(ids).size).toBe(ids.length);
        const routes = endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`);
        expect(new Set(routes).size).toBe(routes.length);
    });

    it('documents list and detail endpoints for every resource', () => {
        for (const key of RESOURCE_KEYS) {
            expect(endpoints.some((endpoint) => endpoint.id === `${key}.list`)).toBe(true);
            expect(endpoints.some((endpoint) => endpoint.id === `${key}.get`)).toBe(true);
        }
    });

    it('documents CRUD for mutable resources only', () => {
        for (const key of RESOURCE_KEYS) {
            const hasCreate = endpoints.some((endpoint) => endpoint.id === `${key}.create`);
            expect(hasCreate).toBe(resources[key].mutable);
        }
    });

    it('only sorts by fields that exist on the resource', () => {
        for (const key of RESOURCE_KEYS) {
            for (const field of resources[key].sortable) {
                expect(resources[key].fields).toContain(field);
            }
        }
    });

    it('builds a valid-looking OpenAPI document', () => {
        const doc = buildOpenApiDocument({ serverUrl: 'http://localhost:4000/' }) as {
            openapi: string;
            servers: { url: string }[];
            paths: Record<string, Record<string, unknown>>;
        };
        expect(doc.openapi).toBe('3.0.3');
        expect(doc.servers[0].url).toBe('http://localhost:4000');
        expect(Object.keys(doc.paths)).toContain('/api/v1/users/{id}');
        expect(doc.paths['/api/v1/users/{id}']).toHaveProperty('get');
        expect(doc.paths['/api/v1/users/{id}']).toHaveProperty('delete');
    });
});
