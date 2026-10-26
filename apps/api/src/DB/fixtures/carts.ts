import type { Cart, Product } from '@mockapis/api-spec';
import { createRandom } from '../../util/random';
import { round2 } from '../../util/text';

export function buildCarts(products: Product[], userCount: number): Cart[] {
    const random = createRandom(6006);
    const carts: Cart[] = [];

    for (let id = 1; id <= 50; id++) {
        const items = random.sample(products, random.int(2, 5)).map((product) => {
            const quantity = random.int(1, 4);
            const total = round2(product.price * quantity);
            return {
                id: product.id,
                title: product.title,
                price: product.price,
                quantity,
                total,
                discountPercentage: product.discountPercentage,
                discountedTotal: round2(total * (1 - product.discountPercentage / 100)),
                thumbnail: product.thumbnail,
            };
        });

        carts.push({
            id,
            userId: id === 1 ? 1 : random.int(2, userCount),
            products: items,
            total: round2(items.reduce((sum, item) => sum + item.total, 0)),
            discountedTotal: round2(items.reduce((sum, item) => sum + item.discountedTotal, 0)),
            totalProducts: items.length,
            totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        });
    }
    return carts;
}
