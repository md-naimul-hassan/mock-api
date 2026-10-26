import { type Request } from 'express';
import { type IErrorMessage, type IErrorResponse } from '../types/errors.types';

export const buildErrorBody = (req: Request, status: number, message: string, code: string, errors?: IErrorMessage[]): IErrorResponse => ({
    message,
    status,
    code,
    path: req.originalUrl.split('?')[0],
    requestId: req.requestId,
    ...(errors && errors.length > 0 ? { errors } : {}),
});
