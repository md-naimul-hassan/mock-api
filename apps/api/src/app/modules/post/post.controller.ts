import { createMutationHandlers, createReadHandlers } from '../../../helpers/resourceController';
import { PostService } from './post.service';

const read = createReadHandlers(PostService);

export const PostController = {
    ...read,
    ...createMutationHandlers(PostService, {
        references: [{ field: 'userId', resource: 'users' }],
        complete: (body) => ({ ...body, tags: body.tags ?? [] }),
    }),
    comments: read.relation('comments', 'postId'),
};
