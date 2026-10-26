import { ERROR_CODES, type AuthUser } from '@mockapis/api-spec';
import { type z } from 'zod';
import { type LoginBody, type RefreshBody, type RegisterBody } from '@mockapis/api-spec';
import config from '../../../config';
import ApiError from '../../../errors/ApiErrors';
import { jwtHelper, type DemoTokenPayload } from '../../../helpers/jwtHelper';
import { verifyPassword } from '../../../util/password';
import { User } from '../user/user.model';
import { UserService } from '../user/user.service';
import { type IUser } from '../user/user.interface';

const NOTICE = 'Demo token for practice only. Do not use Mock APIs authentication to secure real applications.';

const toAuthUser = (user: Pick<IUser, 'id' | 'username' | 'email' | 'firstName' | 'lastName' | 'role' | 'image'>): AuthUser => ({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    image: user.image,
});

const issueTokens = (user: AuthUser, expiresInMins = config.jwt.access_expires_mins, simulated = false) => ({
    accessToken: jwtHelper.createToken(user, 'access', expiresInMins, simulated),
    refreshToken: jwtHelper.createToken(user, 'refresh', config.jwt.refresh_expires_mins, simulated),
    tokenType: 'Bearer' as const,
    expiresIn: expiresInMins * 60,
    demo: true as const,
    notice: NOTICE,
    user,
});

const loginUserFromDB = async (payload: z.infer<typeof LoginBody>) => {
    const filter = payload.username ? { username: payload.username.toLowerCase() } : { email: payload.email!.toLowerCase() };
    const user = await User.findOne(filter).select('+passwordHash').lean<IUser>();
    if (!user || !verifyPassword(payload.password, user.passwordHash)) {
        throw ApiError.unauthorized('Invalid username/email or password', ERROR_CODES.INVALID_CREDENTIALS);
    }
    return issueTokens(toAuthUser(user), payload.expiresInMins);
};

/** Simulated registration: validates and checks conflicts, but never stores the account. */
const registerUserToDB = async (payload: z.infer<typeof RegisterBody>) => {
    await UserService.assertNoConflicts({ username: payload.username, email: payload.email });
    const user: AuthUser = {
        id: await UserService.nextId(),
        username: payload.username.toLowerCase(),
        email: payload.email.toLowerCase(),
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: 'user',
        image: null,
    };
    return issueTokens(user, config.jwt.access_expires_mins, true);
};

const resolveUser = async (payload: DemoTokenPayload): Promise<AuthUser> => {
    if (payload.simulated) return payload.user;
    const user = await User.findOne({ id: Number(payload.sub) }, { _id: 0 }).lean<IUser>();
    if (!user) throw ApiError.unauthorized('The user for this token no longer exists', ERROR_CODES.INVALID_TOKEN);
    return toAuthUser(user);
};

const refreshTokens = async (payload: z.infer<typeof RefreshBody>) => {
    const decoded = jwtHelper.verifyToken(payload.refreshToken, 'refresh');
    const user = await resolveUser(decoded);
    return issueTokens(user, payload.expiresInMins, decoded.simulated);
};

export const AuthService = { loginUserFromDB, registerUserToDB, resolveUser, refreshTokens };
