import { type Model } from 'mongoose';
import type { Post } from '@mockapis/api-spec';

export type IPost = Post;

export type PostModel = Model<IPost>;
