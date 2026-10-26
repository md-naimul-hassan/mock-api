import { type Model } from 'mongoose';
import type { Quote } from '@mockapis/api-spec';

export type IQuote = Quote;

export type QuoteModel = Model<IQuote>;
