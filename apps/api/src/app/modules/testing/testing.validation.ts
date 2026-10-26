import { z } from 'zod';
import { MAX_DELAY_MS } from '@mockapis/api-spec';
import { intParam } from '../../../helpers/listQuery';

export const TestingValidation = {
    delay: {
        query: z.strictObject({
            ms: intParam('ms', 0, MAX_DELAY_MS),
        }),
    },
    status: {
        params: z.object({ code: z.string().regex(/^\d{3}$/, 'code must be a 3-digit HTTP status code').transform(Number) }),
        query: z.strictObject({ delay: z.string().optional() }),
    },
};
