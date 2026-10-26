import { type Request, type Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import type { ListQuery } from '../../../helpers/listQuery';
import { createMutationHandlers, createReadHandlers } from '../../../helpers/resourceController';
import { ProductService } from './product.service';

const categories = catchAsync(async (_req: Request, res: Response) => {
    sendResponse(res, await ProductService.categoriesFromDB());
});

const byCategory = catchAsync(async (req: Request, res: Response) => {
    const { category } = req.validated.params as { category: string };
    sendResponse(res, await ProductService.productsByCategoryFromDB(category, req.validated.query as ListQuery));
});

export const ProductController = {
    ...createReadHandlers(ProductService),
    ...createMutationHandlers(ProductService),
    categories,
    byCategory,
};
