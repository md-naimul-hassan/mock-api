import { describe, expect, it, vi } from 'vitest';
import { sendRequest } from './http';

const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

describe('sendRequest', () => {
    it('captures status, headers, JSON body, size, and timing', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ id: 1 }, 200, { 'x-request-id': 'abc' }));
        const result = await sendRequest({ method: 'GET', url: 'http://api.test/api/v1/users/1', headers: [] }, { fetchImpl });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.status).toBe(200);
        expect(result.json).toEqual({ id: 1 });
        expect(result.headers).toContainEqual(['x-request-id', 'abc']);
        expect(result.sizeBytes).toBe(8);
        expect(result.timeMs).toBeGreaterThanOrEqual(0);
    });

    it('sends method, headers, and body for writes but not for GET', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({}, 201));
        await sendRequest({ method: 'POST', url: 'http://api.test/x', headers: [{ key: 'X-A', value: '1' }], body: '{"a":1}' }, { fetchImpl });
        const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
        expect(init.method).toBe('POST');
        expect(init.body).toBe('{"a":1}');
        expect(new Headers(init.headers).get('content-type')).toBe('application/json');
        expect(new Headers(init.headers).get('x-a')).toBe('1');

        await sendRequest({ method: 'GET', url: 'http://api.test/x', headers: [], body: '{"a":1}' }, { fetchImpl });
        expect((fetchImpl.mock.calls[1] as unknown as [string, RequestInit])[1].body).toBeUndefined();
    });

    it('handles empty 204 responses', async () => {
        const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
        const result = await sendRequest({ method: 'DELETE', url: 'http://api.test/x', headers: [] }, { fetchImpl });
        expect(result).toMatchObject({ ok: true, status: 204, bodyText: '', json: undefined });
    });

    it('reports network errors without throwing', async () => {
        const fetchImpl = vi.fn(async () => {
            throw new TypeError('Failed to fetch');
        });
        const result = await sendRequest({ method: 'GET', url: 'http://api.test/x', headers: [] }, { fetchImpl });
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toMatch(/Network error \(Failed to fetch\)/);
        expect(result.aborted).toBe(false);
    });

    it('rejects invalid URLs and protocols before sending', async () => {
        const fetchImpl = vi.fn();
        expect(await sendRequest({ method: 'GET', url: 'api.test/x', headers: [] }, { fetchImpl })).toMatchObject({ ok: false, error: expect.stringMatching(/full URL/) });
        expect(await sendRequest({ method: 'GET', url: 'file:///etc/passwd', headers: [] }, { fetchImpl })).toMatchObject({ ok: false });
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('times out slow requests', async () => {
        const fetchImpl = vi.fn(
            (_url: string, init: RequestInit) =>
                new Promise<Response>((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))),
        );
        const result = await sendRequest({ method: 'GET', url: 'http://api.test/slow', headers: [] }, { fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 20 });
        expect(result).toMatchObject({ ok: false, aborted: false, error: 'The request timed out.' });
    });
});
