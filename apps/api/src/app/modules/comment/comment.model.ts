import { model, Schema } from 'mongoose';
import { type CommentModel, type IComment } from './comment.interface';

const commentSchema = new Schema<IComment, CommentModel>(
    {
        id: { type: Number, required: true, unique: true },
        body: { type: String, required: true },
        postId: { type: Number, required: true, index: true },
        userId: { type: Number, required: true, index: true },
        likes: { type: Number, required: true },
    },
    { collection: 'comments', versionKey: false },
);

export const Comment = model<IComment, CommentModel>('Comment', commentSchema);
