import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { AuthResponseSchema, AuthUserSchema, DEMO_CREDENTIALS } from '@mockapis/api-spec';
import { jwtHelper } from '../src/helpers/jwtHelper';
import { api, expectError, login } from './helpers';

const emily = { id: 1, username: 'emilyc', email: 'emily.carter@example.com', firstName: 'Emily', lastName: 'Carter', role: 'admin' as const, image: 'http://localhost:4000/api/v1/images/users/1' };

describe('POST /auth/login', () => {
    it('returns demo tokens and the user for valid credentials', async () => {
        const response = await api().post('/api/v1/auth/login').send(DEMO_CREDENTIALS.admin);
        expect(response.status).toBe(200);
        expect(AuthResponseSchema.safeParse(response.body).success).toBe(true);
        expect(response.body).toMatchObject({ tokenType: 'Bearer', expiresIn: 1800, demo: true, user: emily });
        const decoded = jwt.decode(response.body.accessToken) as jwt.JwtPayload;
        expect(decoded).toMatchObject({ iss: 'mockapis-demo', demo: true, type: 'access', sub: '1' });
    });

    it('accepts email instead of username and honors expiresInMins', async () => {
        const response = await api().post('/api/v1/auth/login').send({ email: 'Emily.Carter@example.com', password: 'emilycpass', expiresInMins: 5 });
        expect(response.status).toBe(200);
        expect(response.body.expiresIn).toBe(300);
    });

    it('rejects a wrong password or unknown user with 401', async () => {
        expectError(await api().post('/api/v1/auth/login').send({ username: 'emilyc', password: 'nope' }), 401, 'INVALID_CREDENTIALS');
        expectError(await api().post('/api/v1/auth/login').send({ username: 'ghost', password: 'nope' }), 401, 'INVALID_CREDENTIALS');
    });

    it('returns 422 for missing fields', async () => {
        const missingPassword = await api().post('/api/v1/auth/login').send({ username: 'emilyc' });
        expectError(missingPassword, 422, 'VALIDATION_ERROR');
        expect(missingPassword.body.errors).toContainEqual({ path: 'password', message: 'password is required' });

        const missingUser = await api().post('/api/v1/auth/login').send({ password: 'x' });
        expect(missingUser.body.errors).toContainEqual({ path: 'username', message: 'username or email is required' });

        expectError(await api().post('/api/v1/auth/login').send({ ...DEMO_CREDENTIALS.admin, expiresInMins: 0 }), 422, 'VALIDATION_ERROR');
    });
});

describe('GET /auth/me', () => {
    it('returns the current user for a valid bearer token', async () => {
        const { accessToken } = await login();
        const response = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
        expect(response.status).toBe(200);
        expect(AuthUserSchema.safeParse(response.body).success).toBe(true);
        expect(response.body).toEqual(emily);
    });

    it('requires an Authorization header', async () => {
        const response = await api().get('/api/v1/auth/me');
        expectError(response, 401, 'MISSING_TOKEN');
        expect(response.headers['www-authenticate']).toContain('Bearer');
    });

    it.each(['Token abc', 'Bearer', 'Basic dXNlcjpwYXNz', 'Bearer a b'])('rejects malformed header "%s"', async (header) => {
        expectError(await api().get('/api/v1/auth/me').set('Authorization', header), 401, 'INVALID_AUTH_HEADER');
    });

    it('rejects invalid, tampered, and wrong-type tokens', async () => {
        const { accessToken, refreshToken } = await login();
        expectError(await api().get('/api/v1/auth/me').set('Authorization', 'Bearer not.a.token'), 401, 'INVALID_TOKEN');
        expectError(await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken.slice(0, -2)}xx`), 401, 'INVALID_TOKEN');
        expectError(await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${refreshToken}`), 401, 'INVALID_TOKEN');
        const foreign = jwt.sign({ type: 'access', demo: true, user: emily }, 'some-other-secret-value', { issuer: 'mockapis-demo', audience: 'mockapis-practice' });
        expectError(await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${foreign}`), 401, 'INVALID_TOKEN');
    });

    it('rejects expired tokens with TOKEN_EXPIRED', async () => {
        const expired = jwtHelper.createToken(emily, 'access', -1);
        const response = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${expired}`);
        expectError(response, 401, 'TOKEN_EXPIRED');
    });
});

describe('POST /auth/refresh', () => {
    it('exchanges a refresh token for new tokens', async () => {
        const { refreshToken } = await login();
        const response = await api().post('/api/v1/auth/refresh').send({ refreshToken });
        expect(response.status).toBe(200);
        expect(AuthResponseSchema.safeParse(response.body).success).toBe(true);
        const me = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${response.body.accessToken}`);
        expect(me.body.id).toBe(1);
    });

    it('rejects access tokens, garbage, and missing tokens', async () => {
        const { accessToken } = await login();
        expectError(await api().post('/api/v1/auth/refresh').send({ refreshToken: accessToken }), 401, 'INVALID_TOKEN');
        expectError(await api().post('/api/v1/auth/refresh').send({ refreshToken: 'garbage' }), 401, 'INVALID_TOKEN');
        expectError(await api().post('/api/v1/auth/refresh').send({}), 422, 'VALIDATION_ERROR');
    });

    it('rejects expired refresh tokens', async () => {
        const expired = jwtHelper.createToken(emily, 'refresh', -1);
        expectError(await api().post('/api/v1/auth/refresh').send({ refreshToken: expired }), 401, 'TOKEN_EXPIRED');
    });
});

describe('POST /auth/register', () => {
    const newUser = { firstName: 'Jordan', lastName: 'Lee', username: 'jordanlee', email: 'jordan.lee@example.com', password: 'supersecret1' };

    it('returns 201 with tokens that work for /auth/me, without persisting the user', async () => {
        const response = await api().post('/api/v1/auth/register').send(newUser);
        expect(response.status).toBe(201);
        expect(response.body.user).toEqual({ id: 101, username: 'jordanlee', email: 'jordan.lee@example.com', firstName: 'Jordan', lastName: 'Lee', role: 'user', image: null });

        const me = await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${response.body.accessToken}`);
        expect(me.body.username).toBe('jordanlee');

        const search = await api().get('/api/v1/users/search?q=jordanlee');
        expect(search.body.total).toBe(0);
        expectError(await api().post('/api/v1/auth/login').send({ username: 'jordanlee', password: 'supersecret1' }), 401, 'INVALID_CREDENTIALS');
    });

    it('returns 409 for taken usernames', async () => {
        expectError(await api().post('/api/v1/auth/register').send({ ...newUser, username: 'EmilyC' }), 409, 'CONFLICT');
    });

    it('validates the password length', async () => {
        const response = await api().post('/api/v1/auth/register').send({ ...newUser, password: 'short' });
        expectError(response, 422, 'VALIDATION_ERROR');
        expect(response.body.errors).toContainEqual({ path: 'password', message: 'password must be at least 8 characters' });
    });
});

describe('GET /auth/admin', () => {
    it('allows admins', async () => {
        const { accessToken } = await login(DEMO_CREDENTIALS.admin);
        const response = await api().get('/api/v1/auth/admin').set('Authorization', `Bearer ${accessToken}`);
        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe('admin');
    });

    it('returns 403 for non-admin users', async () => {
        const { accessToken } = await login(DEMO_CREDENTIALS.user);
        expectError(await api().get('/api/v1/auth/admin').set('Authorization', `Bearer ${accessToken}`), 403, 'FORBIDDEN');
    });
});
