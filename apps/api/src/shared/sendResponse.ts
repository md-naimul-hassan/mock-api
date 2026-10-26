import { type Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SIMULATED_HEADER } from '@mockapis/api-spec';

type ResponseOptions = {
    statusCode?: number;
    simulated?: boolean;
    headers?: Record<string, string>;
};

/** Sends a plain JSON body (Mock APIs responses are not wrapped in an envelope). */
const sendResponse = <T>(res: Response, data: T, options: ResponseOptions = {}) => {
    if (res.headersSent) return;
    if (options.simulated) res.setHeader(SIMULATED_HEADER, 'true');
    for (const [name, value] of Object.entries(options.headers ?? {})) res.setHeader(name, value);
    res.status(options.statusCode ?? StatusCodes.OK).json(data);
};

export const sendNoContent = (res: Response, options: Pick<ResponseOptions, 'simulated'> = {}) => {
    if (res.headersSent) return;
    if (options.simulated) res.setHeader(SIMULATED_HEADER, 'true');
    res.status(StatusCodes.NO_CONTENT).end();
};

export default sendResponse;
