import { type Request, type Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { createReadHandlers } from '../../../helpers/resourceController';
import { QuoteService } from './quote.service';

const random = catchAsync(async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    sendResponse(res, await QuoteService.randomQuoteFromDB());
});

export const QuoteController = { ...createReadHandlers(QuoteService), random };
