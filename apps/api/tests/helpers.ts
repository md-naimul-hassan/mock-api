import request from 'supertest';
import { DEMO_CREDENTIALS, ErrorSchema } from '@mockapis/api-spec';
import { expect } from 'vitest';
import { createApp, type AppOptions } from '../src/app';
import { buildFixtures } from '../src/DB/fixtures';

export const app = createApp({ logRequests: false });
export const api = () => request(app);
export const apiWith = (options: AppOptions) => request(createApp({ logRequests: false, ...options }));

export const fixtures = buildFixtures(process.env.PUBLIC_API_URL!);

export async function login(credentials: { username: string; password: string } = DEMO_CREDENTIALS.admin) {
    const response = await api().post('/api/v1/auth/login').send(credentials);
    expect(response.status).toBe(200);
    return response.body as { accessToken: string; refreshToken: string };
}

/** Asserts the standard error body: message, status, code, path, requestId. */
export function expectError(response: request.Response, status: number, code: string) {
    expect(response.status).toBe(status);
    const parsed = ErrorSchema.safeParse(response.body);
    expect(parsed.success, JSON.stringify(response.body)).toBe(true);
    expect(response.body.status).toBe(status);
    expect(response.body.code).toBe(code);
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
    const { req } = response as request.Response & { req: { path: string } };
    expect(response.body.path).toBe(req.path.split('?')[0]);
    expect(JSON.stringify(response.body)).not.toMatch(/stack|mongo(db)?:\/\/|at .+\.ts:\d+/i);
}
