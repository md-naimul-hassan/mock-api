import jwt from 'jsonwebtoken';
import { ERROR_CODES, type AuthUser } from '@mockapis/api-spec';
import config from '../config';
import ApiError from '../errors/ApiErrors';

const ISSUER = 'mockapis-demo';
const AUDIENCE = 'mockapis-practice';

export type TokenType = 'access' | 'refresh';

export type DemoTokenPayload = {
    sub: string;
    type: TokenType;
    demo: true;
    /** True for users created by the simulated register endpoint (not stored in the database). */
    simulated: boolean;
    user: AuthUser;
};

const secretFor = (type: TokenType) => (type === 'access' ? config.jwt.access_secret : config.jwt.refresh_secret);

const createToken = (user: AuthUser, type: TokenType, expiresInMins: number, simulated = false) => {
    const payload: Omit<DemoTokenPayload, 'sub'> = { type, demo: true, simulated, user };
    return jwt.sign(payload, secretFor(type), {
        algorithm: 'HS256',
        expiresIn: expiresInMins * 60,
        issuer: ISSUER,
        audience: AUDIENCE,
        subject: String(user.id),
    });
};

const verifyToken = (token: string, type: TokenType): DemoTokenPayload => {
    let payload: jwt.JwtPayload | string;
    try {
        payload = jwt.verify(token, secretFor(type), { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw ApiError.unauthorized(`The ${type} token has expired. ${type === 'access' ? 'Refresh it or log in again.' : 'Log in again.'}`, ERROR_CODES.TOKEN_EXPIRED);
        }
        throw ApiError.unauthorized(`The ${type} token is invalid.`, ERROR_CODES.INVALID_TOKEN);
    }
    if (typeof payload === 'string' || payload.type !== type || payload.demo !== true || !payload.user) {
        throw ApiError.unauthorized(`The provided token is not a valid ${type} token.`, ERROR_CODES.INVALID_TOKEN);
    }
    return payload as unknown as DemoTokenPayload;
};

export const jwtHelper = { createToken, verifyToken };
