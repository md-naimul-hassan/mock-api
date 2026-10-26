import { type Model, model, Schema } from 'mongoose';
import type { ResourceKey } from '@mockapis/api-spec';
import { Cart } from '../app/modules/cart/cart.model';
import { Comment } from '../app/modules/comment/comment.model';
import { Post } from '../app/modules/post/post.model';
import { Product } from '../app/modules/product/product.model';
import { Quote } from '../app/modules/quote/quote.model';
import { Recipe } from '../app/modules/recipe/recipe.model';
import { Todo } from '../app/modules/todo/todo.model';
import { User } from '../app/modules/user/user.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resourceModels: Record<ResourceKey, Model<any>> = {
    users: User,
    products: Product,
    posts: Post,
    comments: Comment,
    todos: Todo,
    carts: Cart,
    recipes: Recipe,
    quotes: Quote,
};

type ISeedMeta = { _id: string; fingerprint: string; seededAt: Date; counts: Record<string, number> };

export const SeedMeta = model<ISeedMeta>(
    'SeedMeta',
    new Schema<ISeedMeta>(
        {
            _id: { type: String, required: true },
            fingerprint: { type: String, required: true },
            seededAt: { type: Date, required: true },
            counts: { type: Schema.Types.Mixed, default: {} },
        },
        { collection: 'seed_meta', versionKey: false },
    ),
);
