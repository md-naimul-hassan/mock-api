import ApiError from '../../../errors/ApiErrors';
import type { ListQuery } from '../../../helpers/listQuery';
import { createResourceService } from '../../../helpers/resourceService';
import { titleCase } from '../../../util/text';
import { Product } from './product.model';

const productService = createResourceService('products');

const categoriesFromDB = async () => {
    const groups = await Product.aggregate<{ _id: string; productCount: number }>([
        { $group: { _id: '$category', productCount: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    const categories = groups.map((group) => ({ slug: group._id, name: titleCase(group._id), productCount: group.productCount }));
    return { categories, total: categories.length };
};

const productsByCategoryFromDB = async (category: string, query: ListQuery) => {
    if (!(await Product.exists({ category }))) {
        throw ApiError.notFound(`Product category "${category}" not found. See /api/v1/products/categories`);
    }
    return productService.list(query, { category });
};

export const ProductService = { ...productService, categoriesFromDB, productsByCategoryFromDB };
