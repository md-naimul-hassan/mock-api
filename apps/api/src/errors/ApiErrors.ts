import { ERROR_CODES, type ErrorCode } from '@mockapis/api-spec';
import { StatusCodes } from 'http-status-codes';
import { type IErrorMessage } from '../types/errors.types';

class ApiError extends Error {
    statusCode: number;
    code: ErrorCode;
    errors?: IErrorMessage[];
    headers?: Record<string, string>;

    constructor(statusCode: number, message: string, code: ErrorCode, errors?: IErrorMessage[], headers?: Record<string, string>) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors;
        this.headers = headers;
        Error.captureStackTrace(this, this.constructor);
    }

    static notFound(message: string) {
        return new ApiError(StatusCodes.NOT_FOUND, message, ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    static badRequest(message: string, errors?: IErrorMessage[], code: ErrorCode = ERROR_CODES.INVALID_PARAMETER) {
        return new ApiError(StatusCodes.BAD_REQUEST, message, code, errors);
    }

    static validation(message: string, errors?: IErrorMessage[]) {
        return new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, message, ERROR_CODES.VALIDATION_ERROR, errors);
    }

    static conflict(message: string, errors?: IErrorMessage[]) {
        return new ApiError(StatusCodes.CONFLICT, message, ERROR_CODES.CONFLICT, errors);
    }

    static unauthorized(message: string, code: ErrorCode) {
        return new ApiError(StatusCodes.UNAUTHORIZED, message, code, undefined, { 'WWW-Authenticate': 'Bearer realm="mockapis-demo"' });
    }

    static forbidden(message: string) {
        return new ApiError(StatusCodes.FORBIDDEN, message, ERROR_CODES.FORBIDDEN);
    }

    static unavailable(message: string, code: ErrorCode = ERROR_CODES.SERVICE_UNAVAILABLE) {
        return new ApiError(StatusCodes.SERVICE_UNAVAILABLE, message, code, undefined, { 'Retry-After': '10' });
    }
}
export default ApiError;
