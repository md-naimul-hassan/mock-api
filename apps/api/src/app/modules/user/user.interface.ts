import { type Model } from 'mongoose';
import type { User } from '@mockapis/api-spec';

export type IUser = User & { passwordHash: string };

export type UserModel = Model<IUser>;
