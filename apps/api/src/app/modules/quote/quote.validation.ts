import { delayOnlyQuerySchema } from '../../../helpers/listQuery';
import { createResourceValidation } from '../../../helpers/resourceValidation';

export const QuoteValidation = {
    ...createResourceValidation('quotes'),
    random: { query: delayOnlyQuerySchema },
};
