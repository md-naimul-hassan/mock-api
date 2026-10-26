import ApiError from '../../../errors/ApiErrors';
import { createResourceService } from '../../../helpers/resourceService';
import { type IErrorMessage } from '../../../types/errors.types';
import { escapeRegex } from '../../../util/text';
import { User } from './user.model';

const userService = createResourceService('users');

const caseInsensitive = (value: string) => new RegExp(`^${escapeRegex(value)}$`, 'i');

/** Simulated creates/updates must not reuse an email or username owned by another seeded user (409). */
const assertNoConflicts = async (body: Record<string, unknown>, id?: number) => {
    const errors: IErrorMessage[] = [];
    for (const field of ['email', 'username'] as const) {
        const value = body[field];
        if (typeof value !== 'string') continue;
        const owner = await User.findOne({ [field]: caseInsensitive(value) }, { id: 1, _id: 0 }).lean<{ id: number }>();
        if (owner && owner.id !== id) errors.push({ path: field, message: `${field} "${value}" is already used by another user` });
    }
    if (errors.length > 0) throw ApiError.conflict('A user with this email or username already exists', errors);
};

export const UserService = { ...userService, assertNoConflicts };
