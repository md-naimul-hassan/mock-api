import { z } from 'zod';
import { resources } from '@mockapis/api-spec';
import { buildListQuerySchema, delayOnlyQuerySchema } from '../../../helpers/listQuery';
import { createResourceValidation } from '../../../helpers/resourceValidation';

export const ProductValidation = {
    ...createResourceValidation('products'),
    categories: { query: delayOnlyQuerySchema },
    byCategory: {
        params: z.object({
            category: z.string().regex(/^[a-z0-9-]{1,60}$/, 'category must be a lowercase slug such as "smartphones"'),
        }),
        query: buildListQuerySchema(resources.products, { filters: false }),
    },
};
