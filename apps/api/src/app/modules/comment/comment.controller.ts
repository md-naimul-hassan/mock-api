import { createMutationHandlers, createReadHandlers } from '../../../helpers/resourceController';
import { CommentService } from './comment.service';

export const CommentController = {
    ...createReadHandlers(CommentService),
    ...createMutationHandlers(CommentService, {
        references: [
            { field: 'postId', resource: 'posts' },
            { field: 'userId', resource: 'users' },
        ],
        complete: (body) => ({ ...body, likes: 0 }),
    }),
};
