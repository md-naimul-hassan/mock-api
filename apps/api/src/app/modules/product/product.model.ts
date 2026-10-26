import { model, Schema } from 'mongoose';
import { AVAILABILITY_STATUSES } from '@mockapis/api-spec';
import { type IProduct, type ProductModel } from './product.interface';

const productSchema = new Schema<IProduct, ProductModel>(
    {
        id: { type: Number, required: true, unique: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: { type: String, required: true, index: true },
        brand: { type: String, required: true, index: true },
        price: { type: Number, required: true, index: true },
        discountPercentage: { type: Number, required: true },
        rating: { type: Number, required: true },
        stock: { type: Number, required: true },
        sku: { type: String, required: true },
        tags: { type: [String], default: [] },
        availabilityStatus: { type: String, enum: AVAILABILITY_STATUSES, required: true },
        thumbnail: { type: String, required: true },
    },
    { collection: 'products', versionKey: false },
);

export const Product = model<IProduct, ProductModel>('Product', productSchema);
