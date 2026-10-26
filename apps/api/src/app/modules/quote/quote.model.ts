import { model, Schema } from 'mongoose';
import { type IQuote, type QuoteModel } from './quote.interface';

const quoteSchema = new Schema<IQuote, QuoteModel>(
    {
        id: { type: Number, required: true, unique: true },
        quote: { type: String, required: true },
        author: { type: String, required: true, index: true },
    },
    { collection: 'quotes', versionKey: false },
);

export const Quote = model<IQuote, QuoteModel>('Quote', quoteSchema);
