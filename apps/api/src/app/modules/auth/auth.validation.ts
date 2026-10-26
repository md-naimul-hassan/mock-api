import { LoginBody, RefreshBody, RegisterBody } from '@mockapis/api-spec';
import { delayOnlyQuerySchema } from '../../../helpers/listQuery';

export const AuthValidation = {
    login: { query: delayOnlyQuerySchema, body: LoginBody },
    register: { query: delayOnlyQuerySchema, body: RegisterBody },
    refresh: { query: delayOnlyQuerySchema, body: RefreshBody },
    me: { query: delayOnlyQuerySchema },
};
