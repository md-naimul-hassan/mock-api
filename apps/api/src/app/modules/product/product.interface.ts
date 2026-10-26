import { type Model } from 'mongoose';
import type { Product } from '@mockapis/api-spec';

export type IProduct = Product;

export type ProductModel = Model<IProduct>;
