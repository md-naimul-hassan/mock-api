import { type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import { buildErrorBody } from '../../shared/errorBody';

const notFound = (req: Request, res: Response) => {
    res.status(StatusCodes.NOT_FOUND).json(
        buildErrorBody(req, StatusCodes.NOT_FOUND, `Route ${req.method} ${req.path} does not exist. See /api/v1 for available resources.`, ERROR_CODES.ROUTE_NOT_FOUND),
    );
};

export default notFound;
