import { createResourceService } from '../../../helpers/resourceService';
import { Quote } from './quote.model';

const quoteService = createResourceService('quotes');

const randomQuoteFromDB = async () => {
    const [quote] = await Quote.aggregate([{ $sample: { size: 1 } }, { $project: { _id: 0 } }]);
    return quote;
};

export const QuoteService = { ...quoteService, randomQuoteFromDB };
