import { type Model } from 'mongoose';
import type { Cart } from '@mockapis/api-spec';

export type ICart = Cart;

export type CartModel = Model<ICart>;
