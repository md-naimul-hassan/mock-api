import { model, Schema } from 'mongoose';
import { type CartModel, type ICart } from './cart.interface';

const cartProductSchema = new Schema(
    {
        id: { type: Number, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        total: { type: Number, required: true },
        discountPercentage: { type: Number, required: true },
        discountedTotal: { type: Number, required: true },
        thumbnail: { type: String, required: true },
    },
    { _id: false },
);

const cartSchema = new Schema<ICart, CartModel>(
    {
        id: { type: Number, required: true, unique: true },
        userId: { type: Number, required: true, index: true },
        products: { type: [cartProductSchema], default: [] },
        total: { type: Number, required: true },
        discountedTotal: { type: Number, required: true },
        totalProducts: { type: Number, required: true },
        totalQuantity: { type: Number, required: true },
    },
    { collection: 'carts', versionKey: false },
);

export const Cart = model<ICart, CartModel>('Cart', cartSchema);
