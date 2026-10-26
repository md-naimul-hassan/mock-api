import { describe, expect, it } from 'vitest';
import { api, expectError } from './helpers';

const OBJECT_ID = /^[a-fA-F0-9]{24}$/;

async function registerBuilder(suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`) {
    const username = `builder_${suffix}`.slice(0, 32);
    const response = await api()
        .post('/api/v1/builder/auth/register')
        .send({ username, email: `${username}@example.com`, password: 'password123' });
    expect(response.status).toBe(201);
    expect(response.body.user.id).toMatch(OBJECT_ID);
    return { username, token: response.body.accessToken as string, user: response.body.user };
}

describe('API Builder', () => {
    it('registers, creates a project and endpoint, and serves the public mock URL', async () => {
        const { token } = await registerBuilder();

        const created = await api()
            .post('/api/v1/builder/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Users mock', description: 'Frontend fixture' });
        expect(created.status).toBe(201);
        expect(created.body.id).toMatch(OBJECT_ID);
        expect(created.body.publicId).toBeUndefined();
        expect(created.body.basePath).toBe(`/api/v1/mock-apis/${created.body.id}`);

        const endpoint = await api()
            .post(`/api/v1/builder/projects/${created.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                method: 'GET',
                path: '/api/users',
                statusCode: 200,
                responseBody: { success: true, data: [{ id: 1, name: 'Ada' }] },
                responseHeaders: { 'X-Demo': 'builder' },
                delayMs: 0,
                description: 'List users',
            });
        expect(endpoint.status).toBe(201);
        expect(endpoint.body.id).toMatch(OBJECT_ID);
        expect(endpoint.body.projectId).toBe(created.body.id);

        const live = await api().get(`/api/v1/mock-apis/${created.body.id}/api/users`);
        expect(live.status).toBe(200);
        expect(live.body).toEqual({ success: true, data: [{ id: 1, name: 'Ada' }] });
        expect(live.headers['x-demo']).toBe('builder');
        expect(live.headers['x-mockapis-builder']).toBe('true');
        expect(live.headers['x-mockapis-project']).toBe(created.body.id);
    });

    it('matches path params and rejects unauthorized management', async () => {
        const owner = await registerBuilder();
        const other = await registerBuilder();

        const project = await api()
            .post('/api/v1/builder/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Param demo' });
        expect(project.status).toBe(201);

        const endpoint = await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({
                method: 'GET',
                path: '/api/users/:id',
                statusCode: 200,
                responseBody: { id: 'from-mock' },
            });
        expect(endpoint.status).toBe(201);

        const live = await api().get(`/api/v1/mock-apis/${project.body.id}/api/users/42`);
        expect(live.status).toBe(200);
        expect(live.body).toEqual({ id: 'from-mock' });

        const stolen = await api()
            .patch(`/api/v1/builder/projects/${project.body.id}`)
            .set('Authorization', `Bearer ${other.token}`)
            .send({ name: 'Hijacked' });
        expectError(stolen, 403, 'FORBIDDEN');
    });

    it('returns 405 with Allow when method is wrong and 404 when path is missing', async () => {
        const { token } = await registerBuilder();
        const project = await api().post('/api/v1/builder/projects').set('Authorization', `Bearer ${token}`).send({ name: 'Methods' });
        await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({ method: 'GET', path: '/items', statusCode: 200, responseBody: { ok: true } });

        const wrongMethod = await api().post(`/api/v1/mock-apis/${project.body.id}/items`).send({});
        expectError(wrongMethod, 405, 'METHOD_NOT_ALLOWED');
        expect(wrongMethod.headers.allow).toMatch(/GET/);

        const missing = await api().get(`/api/v1/mock-apis/${project.body.id}/missing`);
        expectError(missing, 404, 'ROUTE_NOT_FOUND');
    });

    it('requires auth for management routes and rejects invalid JSON bodies on create', async () => {
        const unauth = await api().get('/api/v1/builder/projects');
        expectError(unauth, 401, 'MISSING_TOKEN');

        const { token } = await registerBuilder();
        const project = await api().post('/api/v1/builder/projects').set('Authorization', `Bearer ${token}`).send({ name: 'Validate' });
        const bad = await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({ method: 'GET', path: 'users', statusCode: 200, responseBody: {} });
        expect(bad.status).toBe(422);
        expect(bad.body.code).toBe('VALIDATION_ERROR');

        const getWithBody = await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({ method: 'GET', path: '/api/items', statusCode: 200, requestBody: { nope: true }, responseBody: {} });
        expect(getWithBody.status).toBe(422);
        expect(getWithBody.body.code).toBe('VALIDATION_ERROR');

        const missingRequestBody = await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({ method: 'POST', path: '/api/items', statusCode: 201, responseBody: { id: 1 } });
        expect(missingRequestBody.status).toBe(422);
        expect(missingRequestBody.body.code).toBe('VALIDATION_ERROR');
        expect(missingRequestBody.body.message).toMatch(/requestBody/i);

        const invalidRequestBody = await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({ method: 'POST', path: '/api/items-2', statusCode: 201, requestBody: 'not-json-object', responseBody: { id: 1 } });
        expect(invalidRequestBody.status).toBe(422);
        expect(invalidRequestBody.body.code).toBe('VALIDATION_ERROR');

        const withRequest = await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                method: 'POST',
                path: '/api/items',
                statusCode: 201,
                requestBody: { title: 'Hello' },
                responseBody: { id: 1, title: 'Hello' },
            });
        expect(withRequest.status).toBe(201);
        expect(withRequest.body.requestBody).toEqual({ title: 'Hello' });
        expect(withRequest.body.responseBody).toEqual({ id: 1, title: 'Hello' });
    });

    it('exposes shareable public project docs without auth', async () => {
        const { token } = await registerBuilder();
        const project = await api().post('/api/v1/builder/projects').set('Authorization', `Bearer ${token}`).send({
            name: 'Shared docs',
            description: 'Public swagger payload',
        });
        await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                method: 'GET',
                path: '/api/products',
                statusCode: 200,
                responseBody: { items: [] },
                description: 'List products',
                enabled: true,
            });
        await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                method: 'POST',
                path: '/api/products',
                statusCode: 201,
                responseBody: { id: 1 },
                description: 'Hidden when disabled',
                enabled: false,
            });

        const docs = await api().get(`/api/v1/builder/public/${project.body.id}`);
        expect(docs.status).toBe(200);
        expect(docs.body.name).toBe('Shared docs');
        expect(docs.body.sharePath).toBe(`/builder/share/${project.body.id}`);
        expect(docs.body.endpoints).toHaveLength(1);
        expect(docs.body.endpoints[0].path).toBe('/api/products');
        expect(docs.body.endpoints[0].method).toBe('GET');

        await api().patch(`/api/v1/builder/projects/${project.body.id}`).set('Authorization', `Bearer ${token}`).send({ enabled: false });
        const disabledDocs = await api().get(`/api/v1/builder/public/${project.body.id}`);
        expectError(disabledDocs, 503, 'SERVICE_UNAVAILABLE');
    });

    it('disables projects and duplicates them', async () => {
        const { token } = await registerBuilder();
        const project = await api().post('/api/v1/builder/projects').set('Authorization', `Bearer ${token}`).send({ name: 'Toggle' });
        await api()
            .post(`/api/v1/builder/projects/${project.body.id}/endpoints`)
            .set('Authorization', `Bearer ${token}`)
            .send({ method: 'GET', path: '/ping', statusCode: 200, responseBody: { pong: true } });

        const disabled = await api()
            .patch(`/api/v1/builder/projects/${project.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ enabled: false });
        expect(disabled.status).toBe(200);

        const live = await api().get(`/api/v1/mock-apis/${project.body.id}/ping`);
        expectError(live, 503, 'SERVICE_UNAVAILABLE');

        const copy = await api().post(`/api/v1/builder/projects/${project.body.id}/duplicate`).set('Authorization', `Bearer ${token}`);
        expect(copy.status).toBe(201);
        expect(copy.body.name).toContain('(copy)');
        expect(copy.body.endpoints).toHaveLength(1);
        expect(copy.body.id).not.toBe(project.body.id);
        expect(copy.body.id).toMatch(OBJECT_ID);
    });
});
