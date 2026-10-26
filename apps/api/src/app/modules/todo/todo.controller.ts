import { createMutationHandlers, createReadHandlers } from '../../../helpers/resourceController';
import { TodoService } from './todo.service';

export const TodoController = {
    ...createReadHandlers(TodoService),
    ...createMutationHandlers(TodoService, {
        references: [{ field: 'userId', resource: 'users' }],
        complete: (body) => ({ todo: body.todo, completed: body.completed ?? false, userId: body.userId }),
    }),
};
