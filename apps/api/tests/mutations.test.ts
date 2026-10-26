import { describe, expect, it } from 'vitest';
import { RESOURCE_KEYS, resources, SIMULATED_HEADER } from '@mockapis/api-spec';
import { api, expectError, fixtures } from './helpers';

const mutable = RESOURCE_KEYS.filter((key) => resources[key].mutable);
const simulatedHeader = SIMULATED_HEADER.toLowerCase();

describe.each(mutable)('simulated CRUD for %s', (key) => {
    const { examples } = resources[key];
    const count = fixtures[key].length;

    it('POST returns 201 with the next ID and the submitted fields', async () => {
        const response = await api().post(`/api/v1/${key}`).send(examples.createBody!);
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({ id: count + 1, ...examples.createBody });
        expect(response.headers[simulatedHeader]).toBe('true');
    });

    it('POST returns 422 with field errors for an empty body', async () => {
        const response = await api().post(`/api/v1/${key}`).send({});
        expectError(response, 422, 'VALIDATION_ERROR');
        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('POST rejects unknown fields', async () => {
        const response = await api().post(`/api/v1/${key}`).send({ ...examples.createBody, isAdmin: true });
        expectError(response, 422, 'VALIDATION_ERROR');
        expect(response.body.errors).toContainEqual({ path: 'isAdmin', message: 'Unknown field(s): isAdmin' });
    });

    it('PUT replaces the record and returns 200', async () => {
        const response = await api().put(`/api/v1/${key}/1`).send(examples.replaceBody!);
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ id: 1, ...examples.replaceBody });
        expect(response.headers[simulatedHeader]).toBe('true');
    });

    it('PUT returns 404 for unknown IDs and 422 for incomplete bodies', async () => {
        expectError(await api().put(`/api/v1/${key}/999999`).send(examples.replaceBody!), 404, 'RESOURCE_NOT_FOUND');
        expectError(await api().put(`/api/v1/${key}/1`).send(examples.patchBody!), 422, 'VALIDATION_ERROR');
    });

    it('PATCH merges fields into the existing record', async () => {
        const original = (await api().get(`/api/v1/${key}/1`)).body;
        const response = await api().patch(`/api/v1/${key}/1`).send(examples.patchBody!);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ ...original, ...examples.patchBody });
    });

    it('PATCH requires at least one field', async () => {
        const response = await api().patch(`/api/v1/${key}/1`).send({});
        expectError(response, 422, 'VALIDATION_ERROR');
        expect(response.body.message).toMatch(/at least one field/);
    });

    it('DELETE returns 204 with an empty body, or 404 for unknown IDs', async () => {
        const response = await api().delete(`/api/v1/${key}/1`);
        expect(response.status).toBe(204);
        expect(response.text).toBe('');
        expect(response.headers[simulatedHeader]).toBe('true');
        expectError(await api().delete(`/api/v1/${key}/999999`), 404, 'RESOURCE_NOT_FOUND');
    });

    it('never modifies the shared seed data', async () => {
        const before = (await api().get(`/api/v1/${key}/1`)).body;
        await api().put(`/api/v1/${key}/1`).send(examples.replaceBody!);
        await api().patch(`/api/v1/${key}/1`).send(examples.patchBody!);
        await api().delete(`/api/v1/${key}/1`);
        await api().post(`/api/v1/${key}`).send(examples.createBody!);

        const after = await api().get(`/api/v1/${key}/1`);
        expect(after.status).toBe(200);
        expect(after.body).toEqual(before);
        const list = await api().get(`/api/v1/${key}?limit=1`);
        expect(list.body.total).toBe(count);
    });
});

describe('mutation business rules', () => {
    it('matches the documented POST /users example exactly', async () => {
        const response = await api().post('/api/v1/users').send({ name: 'Alex Morgan', email: 'alex@example.com' });
        expect(response.status).toBe(201);
        expect(response.body).toEqual({ id: 101, name: 'Alex Morgan', email: 'alex@example.com' });
    });

    it('returns 409 when a new user reuses a seeded email or username', async () => {
        const response = await api().post('/api/v1/users').send({ firstName: 'Copy', email: 'EMILY.CARTER@example.com', username: 'michaelb' });
        expectError(response, 409, 'CONFLICT');
        expect(response.body.errors.map((error: { path: string }) => error.path).sort()).toEqual(['email', 'username']);
    });

    it('allows a user to keep their own email on PATCH', async () => {
        const response = await api().patch('/api/v1/users/1').send({ email: 'emily.carter@example.com' });
        expect(response.status).toBe(200);
    });

    it('validates that referenced records exist', async () => {
        const response = await api().post('/api/v1/comments').send({ body: 'Hi', postId: 999999, userId: 1 });
        expectError(response, 422, 'VALIDATION_ERROR');
        expect(response.body.errors).toEqual([{ path: 'postId', message: 'No post exists with id 999999' }]);
    });

    it('validates types and formats', async () => {
        const response = await api().post('/api/v1/products').send({ title: 'Widget', price: 'free' });
        expectError(response, 422, 'VALIDATION_ERROR');
        expect(response.body.errors).toContainEqual({ path: 'price', message: 'price must be a number' });

        const email = await api().post('/api/v1/users').send({ name: 'Bad Email', email: 'not-an-email' });
        expect(email.body.errors).toContainEqual({ path: 'email', message: 'email must be a valid email address' });
    });

    it('defaults todo completion to false', async () => {
        const response = await api().post('/api/v1/todos').send({ todo: 'Learn HTTP', userId: 1 });
        expect(response.body).toEqual({ id: 201, todo: 'Learn HTTP', completed: false, userId: 1 });
    });

    it('read-only resources reject writes with 405', async () => {
        for (const key of RESOURCE_KEYS.filter((resource) => !resources[resource].mutable)) {
            const response = await api().post(`/api/v1/${key}`).send({});
            expectError(response, 405, 'METHOD_NOT_ALLOWED');
        }
    });
});

describe('request body handling', () => {
    it('returns 400 INVALID_JSON for malformed JSON', async () => {
        const response = await api().post('/api/v1/users').set('Content-Type', 'application/json').send('{"name": ');
        expectError(response, 400, 'INVALID_JSON');
    });

    it('returns 415 for non-JSON bodies', async () => {
        const response = await api().post('/api/v1/users').set('Content-Type', 'text/plain').send('name=Alex');
        expectError(response, 415, 'UNSUPPORTED_MEDIA_TYPE');
    });

    it('returns 422 when the body is missing', async () => {
        const response = await api().post('/api/v1/users');
        expectError(response, 422, 'VALIDATION_ERROR');
        expect(response.body.message).toMatch(/JSON object/);
    });

    it('returns 422 when the body is a JSON array', async () => {
        const response = await api().post('/api/v1/users').send([{ name: 'A' }]);
        expectError(response, 422, 'VALIDATION_ERROR');
    });

    it('returns 413 for oversized bodies', async () => {
        const response = await api()
            .post('/api/v1/test/echo')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ blob: 'x'.repeat(200_000) }));
        expectError(response, 413, 'PAYLOAD_TOO_LARGE');
    });
});
