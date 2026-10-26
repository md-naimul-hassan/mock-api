import { beforeAll, describe, expect, it } from 'vitest';
import { capturedExamples, endpoints } from '@mockapis/api-spec';
import { demoTokens, NON_DETERMINISTIC, normalize, runExample } from '../scripts/lib/exampleRunner';
import { app } from './helpers';

let tokens: Awaited<ReturnType<typeof demoTokens>>;

beforeAll(async () => {
    tokens = await demoTokens(app);
});

/**
 * Every documented endpoint is executed against the real app. This guarantees that
 * documentation, OpenAPI examples, and the implementation never drift apart.
 */
describe.each(endpoints.map((endpoint) => [`${endpoint.method} ${endpoint.path}`, endpoint] as const))('%s', (_label, endpoint) => {
    it(`success example returns ${endpoint.successStatus} and matches the captured docs example`, async () => {
        const live = normalize(endpoint.id, await runExample(app, endpoint, endpoint.example, tokens));
        expect(live.status).toBe(endpoint.successStatus);
        if (endpoint.responseSchema && live.contentType === 'application/json') {
            const parsed = endpoint.responseSchema.safeParse(live.body);
            expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
        }
        const captured = capturedExamples.endpoints[endpoint.id]?.success;
        expect(captured, 'Run "pnpm spec:examples" to capture documentation examples').toBeDefined();
        expect(captured!.status).toBe(live.status);
        if (!NON_DETERMINISTIC.has(endpoint.id)) expect(live.body).toEqual(captured!.body);
    });

    if (endpoint.failure) {
        it(`failure example returns ${endpoint.failureStatus} with the error schema`, async () => {
            const live = normalize(endpoint.id, await runExample(app, endpoint, endpoint.failure!, tokens));
            expect(live.status).toBe(endpoint.failureStatus);
            expect(live.body).toMatchObject({ status: endpoint.failureStatus, code: expect.any(String), message: expect.any(String) });
            expect(capturedExamples.endpoints[endpoint.id]?.failure?.body).toEqual(live.body);
        });
    }
});
