import { model, Schema } from 'mongoose';
import { type IPost, type PostModel } from './post.interface';

const postSchema = new Schema<IPost, PostModel>(
    {
        id: { type: Number, required: true, unique: true },
        title: { type: String, required: true },
        body: { type: String, required: true },
        userId: { type: Number, required: true, index: true },
        tags: { type: [String], default: [], index: true },
        reactions: {
            likes: { type: Number, required: true },
            dislikes: { type: Number, required: true },
        },
        views: { type: Number, required: true },
    },
    { collection: 'posts', versionKey: false },
);

export const Post = model<IPost, PostModel>('Post', postSchema);
