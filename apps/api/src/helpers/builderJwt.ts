import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { ERROR_CODES } from '@mockapis/api-spec';
import config from '../config';
import ApiError from '../errors/ApiErrors';

const ISSUER = 'mockapis-builder';
const AUDIENCE = 'mockapis-builder';

export type BuilderTokenPayload = {
    sub: string;
    type: 'builder_access';
    user: { id: string; username: string; email: string };
};

const createAccessToken = (user: BuilderTokenPayload['user'], expiresInMins: number) => {
    const payload: Omit<BuilderTokenPayload, 'sub'> = {
        type: 'builder_access',
        user: { id: String(user.id), username: user.username, email: user.email },
    };
    return jwt.sign(payload, config.jwt.access_secret, {
        algorithm: 'HS256',
        expiresIn: expiresInMins * 60,
        issuer: ISSUER,
        audience: AUDIENCE,
        subject: String(user.id),
    });
};

const verifyAccessToken = (token: string): BuilderTokenPayload => {
    let payload: jwt.JwtPayload | string;
    try {
        payload = jwt.verify(token, config.jwt.access_secret, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw ApiError.unauthorized('The builder access token has expired. Log in again.', ERROR_CODES.TOKEN_EXPIRED);
        }
        throw ApiError.unauthorized('The builder access token is invalid.', ERROR_CODES.INVALID_TOKEN);
    }
    if (typeof payload === 'string' || payload.type !== 'builder_access' || !payload.user) {
        throw ApiError.unauthorized('The provided token is not a valid builder access token.', ERROR_CODES.INVALID_TOKEN);
    }
    const user = payload.user as { id?: unknown; username?: unknown; email?: unknown };
    const id = typeof user.id === 'string' ? user.id : user.id != null ? String(user.id) : '';
    if (!Types.ObjectId.isValid(id) || String(new Types.ObjectId(id)) !== id) {
        throw ApiError.unauthorized('Your builder session is out of date. Please log in again.', ERROR_CODES.INVALID_TOKEN);
    }
    if (typeof user.username !== 'string' || typeof user.email !== 'string') {
        throw ApiError.unauthorized('The provided token is not a valid builder access token.', ERROR_CODES.INVALID_TOKEN);
    }
    return {
        ...(payload as unknown as BuilderTokenPayload),
        user: { id, username: user.username, email: user.email },
    };
};

export const builderJwt = { createAccessToken, verifyAccessToken };
