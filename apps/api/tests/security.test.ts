import { describe, expect, it } from 'vitest';
import { markSeeded } from '../src/DB';
import { api, apiWith, expectError } from './helpers';

describe('rate limiting', () => {
    it('sends rate-limit headers and returns 429 when the limit is exceeded', async () => {
        const limited = apiWith({ rateLimit: { max: 3, windowMs: 60_000 } });
        const statuses: number[] = [];
        let last;
        for (let i = 0; i < 4; i++) {
            last = await limited.get('/api/v1/quotes/1');
            statuses.push(last.status);
            if (i === 0) {
                expect(last.headers['ratelimit-limit']).toBe('3');
                expect(last.headers['ratelimit-remaining']).toBe('2');
                expect(Number(last.headers['ratelimit-reset'])).toBeGreaterThan(0);
            }
        }
        expect(statuses).toEqual([200, 200, 200, 429]);
        expectError(last!, 429, 'RATE_LIMIT_EXCEEDED');
        expect(Number(last!.headers['retry-after'])).toBeGreaterThan(0);
    });

    it('applies a stricter limit to delayed requests', async () => {
        const limited = apiWith({ rateLimit: { max: 100, delayMax: 1, windowMs: 60_000 } });
        expect((await limited.get('/api/v1/test/delay?ms=0')).status).toBe(200);
        expectError(await limited.get('/api/v1/users/1?delay=0'), 429, 'RATE_LIMIT_EXCEEDED');
        expect((await limited.get('/api/v1/users/1')).status).toBe(200);
    });

    it('does not rate limit health checks', async () => {
        const limited = apiWith({ rateLimit: { max: 1, windowMs: 60_000 } });
        for (let i = 0; i < 3; i++) expect((await limited.get('/health')).status).toBe(200);
    });
});

describe('CORS', () => {
    it('allows any origin without credentials and exposes useful headers', async () => {
        const response = await api().get('/api/v1/users/1').set('Origin', 'https://student-project.example');
        expect(response.headers['access-control-allow-origin']).toBe('*');
        expect(response.headers['access-control-allow-credentials']).toBeUndefined();
        const exposed = response.headers['access-control-expose-headers'];
        for (const header of ['X-Request-Id', 'RateLimit-Remaining', 'X-MockAPIs-Simulated']) expect(exposed).toContain(header);
    });

    it('answers preflight requests for JSON + Authorization', async () => {
        const response = await api()
            .options('/api/v1/users')
            .set('Origin', 'http://localhost:5173')
            .set('Access-Control-Request-Method', 'POST')
            .set('Access-Control-Request-Headers', 'content-type,authorization');
        expect(response.status).toBe(204);
        expect(response.headers['access-control-allow-methods']).toContain('POST');
        expect(response.headers['access-control-allow-headers']).toContain('authorization');
    });
});

describe('security headers', () => {
    it('sets helmet headers and hides the framework', async () => {
        const response = await api().get('/api/v1/users/1');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['content-security-policy']).toContain("default-src 'none'");
        expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
        expect(response.headers['x-powered-by']).toBeUndefined();
    });
});

describe('database availability', () => {
    it('returns 503 for data routes and readiness while the database is not ready', async () => {
        markSeeded(false);
        try {
            const data = await api().get('/api/v1/users');
            expectError(data, 503, 'SERVICE_UNAVAILABLE');
            expect(data.headers['retry-after']).toBeDefined();
            expectError(await api().get('/ready'), 503, 'SERVICE_UNAVAILABLE');
            expect((await api().get('/health')).status).toBe(200);
            expect((await api().get('/api/v1/test/status/200')).status).toBe(200);
        } finally {
            markSeeded(true);
        }
    });
});
