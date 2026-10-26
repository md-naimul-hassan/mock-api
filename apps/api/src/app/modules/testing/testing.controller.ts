import { type Request, type Response } from 'express';
import { ERROR_CODES } from '@mockapis/api-spec';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { buildErrorBody } from '../../../shared/errorBody';
import sendResponse from '../../../shared/sendResponse';
import { sleep } from '../../../util/text';
import { TestingService } from './testing.service';

const echo = catchAsync(async (req: Request, res: Response) => {
    sendResponse(res, TestingService.echoRequest(req));
});

const delay = catchAsync(async (req: Request, res: Response) => {
    const { ms } = req.validated.query as { ms: number };
    await sleep(ms);
    sendResponse(res, { delayedMs: ms, message: `Responded after ${ms}ms` });
});

const EXTRA_HEADERS: Record<number, Record<string, string>> = {
    401: { 'WWW-Authenticate': 'Bearer realm="mockapis-demo"' },
    405: { Allow: 'GET' },
    429: { 'Retry-After': '30' },
    503: { 'Retry-After': '30' },
};

const status = catchAsync(async (req: Request, res: Response) => {
    const { code } = req.validated.params as { code: number };
    TestingService.assertAllowedStatus(code);

    const reason = getReasonPhrase(code);
    for (const [name, value] of Object.entries(EXTRA_HEADERS[code] ?? {})) res.setHeader(name, value);

    if (code === StatusCodes.NO_CONTENT) {
        res.status(code).end();
        return;
    }
    if (code < 400) {
        sendResponse(res, { status: code, message: `Simulated ${code} ${reason} response` }, { statusCode: code });
        return;
    }
    res.status(code).json(buildErrorBody(req, code, `Simulated ${code} ${reason} response`, ERROR_CODES.SIMULATED_STATUS));
});

export const TestingController = { echo, delay, status };
