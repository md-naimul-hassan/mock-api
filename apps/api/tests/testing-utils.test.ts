import { describe, expect, it } from 'vitest';
import { ALLOWED_TEST_STATUS_CODES } from '@mockapis/api-spec';
import { api, expectError } from './helpers';

describe('POST /test/echo', () => {
    it('echoes method, path, query, safe headers, and body', async () => {
        const response = await api()
            .post('/api/v1/test/echo?source=tests&page=2')
            .set('X-Custom-Header', 'hello')
            .send({ message: 'hi', nested: { count: 1 } });
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            method: 'POST',
            path: '/api/v1/test/echo',
            query: { source: 'tests', page: '2' },
            body: { message: 'hi', nested: { count: 1 } },
            contentType: 'application/json',
            redacted: [],
        });
        expect(response.body.headers['x-custom-header']).toBe('hello');
    });

    it('never echoes tokens, cookies, API keys, or passwords', async () => {
        const response = await api()
            .post('/api/v1/test/echo')
            .set('Authorization', 'Bearer super-secret-token')
            .set('Cookie', 'session=abc123')
            .set('X-Api-Key', 'key-123')
            .send({ username: 'emilyc', password: 'emilycpass', profile: { accessToken: 'tok' } });
        const text = JSON.stringify(response.body);
        for (const secret of ['super-secret-token', 'abc123', 'key-123', 'emilycpass', '"tok"']) expect(text).not.toContain(secret);
        expect(response.body.headers.authorization).toBe('[redacted]');
        expect(response.body.body).toEqual({ username: 'emilyc', password: '[redacted]', profile: { accessToken: '[redacted]' } });
        expect(response.body.redacted).toEqual(expect.arrayContaining(['headers.authorization', 'headers.cookie', 'headers.x-api-key', 'body.password', 'body.profile.accessToken']));
    });

    it('returns null body when none is sent', async () => {
        const response = await api().post('/api/v1/test/echo');
        expect(response.body.body).toBeNull();
    });
});

describe('GET /test/delay', () => {
    it('waits the requested time', async () => {
        const started = Date.now();
        const response = await api().get('/api/v1/test/delay?ms=300');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ delayedMs: 300, message: 'Responded after 300ms' });
        expect(Date.now() - started).toBeGreaterThanOrEqual(290);
    });

    it.each(['ms=5001', 'ms=-1', 'ms=abc', ''])('rejects out-of-range or missing ms "%s"', async (query) => {
        expectError(await api().get(`/api/v1/test/delay?${query}`), 400, 'INVALID_PARAMETER');
    });

    it('supports ?delay on resource routes and validates its bounds', async () => {
        const started = Date.now();
        const response = await api().get('/api/v1/users/1?delay=200');
        expect(response.status).toBe(200);
        expect(Date.now() - started).toBeGreaterThanOrEqual(190);
        expectError(await api().get('/api/v1/users?delay=6000'), 400, 'INVALID_PARAMETER');
        expectError(await api().get('/api/v1/users?delay=soon'), 400, 'INVALID_PARAMETER');
    });
});

describe('GET /test/status/:code', () => {
    it.each(ALLOWED_TEST_STATUS_CODES.filter((code) => code >= 400))('responds with %i and the error schema', async (code) => {
        const response = await api().get(`/api/v1/test/status/${code}`);
        expectError(response, code, 'SIMULATED_STATUS');
    });

    it('responds with success codes', async () => {
        const ok = await api().get('/api/v1/test/status/201');
        expect(ok.status).toBe(201);
        expect(ok.body).toEqual({ status: 201, message: 'Simulated 201 Created response' });

        const empty = await api().get('/api/v1/test/status/204');
        expect(empty.status).toBe(204);
        expect(empty.text).toBe('');
    });

    it('adds protocol headers where appropriate', async () => {
        expect((await api().get('/api/v1/test/status/429')).headers['retry-after']).toBe('30');
        expect((await api().get('/api/v1/test/status/401')).headers['www-authenticate']).toContain('Bearer');
    });

    it('rejects codes outside the allowed list', async () => {
        for (const code of ['302', '999', '100', 'abc']) {
            const response = await api().get(`/api/v1/test/status/${code}`);
            expect(response.status).toBe(400);
        }
    });
});
