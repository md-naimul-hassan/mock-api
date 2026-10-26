import { type Model } from 'mongoose';
import type { Comment } from '@mockapis/api-spec';

export type IComment = Comment;

export type CommentModel = Model<IComment>;
