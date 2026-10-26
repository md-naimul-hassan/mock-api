import { type Request, type Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';

type Body<T extends (arg: never) => unknown> = Parameters<T>[0];

const login = catchAsync(async (req: Request, res: Response) => {
    sendResponse(res, await AuthService.loginUserFromDB(req.validated.body as Body<typeof AuthService.loginUserFromDB>));
});

const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.registerUserToDB(req.validated.body as Body<typeof AuthService.registerUserToDB>);
    sendResponse(res, result, { statusCode: StatusCodes.CREATED, simulated: true });
});

const me = catchAsync(async (req: Request, res: Response) => {
    sendResponse(res, await AuthService.resolveUser(req.demoUser!));
});

const refresh = catchAsync(async (req: Request, res: Response) => {
    sendResponse(res, await AuthService.refreshTokens(req.validated.body as Body<typeof AuthService.refreshTokens>));
});

const admin = catchAsync(async (req: Request, res: Response) => {
    const user = await AuthService.resolveUser(req.demoUser!);
    sendResponse(res, { message: `Welcome, ${user.firstName}! You have access to this admin-only demo route.`, user });
});

export const AuthController = { login, register, me, refresh, admin };
