import { createMutationHandlers, createReadHandlers } from '../../../helpers/resourceController';
import { UserService } from './user.service';

const read = createReadHandlers(UserService);
const mutations = createMutationHandlers(UserService, { validate: UserService.assertNoConflicts });

export const UserController = {
    ...read,
    ...mutations,
    posts: read.relation('posts', 'userId'),
    todos: read.relation('todos', 'userId'),
    carts: read.relation('carts', 'userId'),
};
