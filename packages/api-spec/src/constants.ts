export const API_NAME = 'Mock APIs';
export const API_VERSION = '1.0.0';
export const API_PREFIX = '/api/v1';

export const PAGINATION = {
    defaultLimit: 30,
    maxLimit: 100,
    maxSkip: 1_000_000,
} as const;

export const MAX_DELAY_MS = 5000;

export const RATE_LIMIT_DEFAULTS = {
    windowMs: 60_000,
    max: 100,
    delayMax: 20,
} as const;

export const ALLOWED_TEST_STATUS_CODES = [
    200, 201, 202, 204, 400, 401, 403, 404, 405, 409, 410, 418, 422, 429, 500, 501, 502, 503, 504,
] as const;

export const DEMO_CREDENTIALS = {
    admin: { username: 'emilyc', password: 'emilycpass' },
    user: { username: 'michaelb', password: 'michaelbpass' },
} as const;

export const SIMULATED_HEADER = 'X-MockAPIs-Simulated';

export const EXPOSED_RESPONSE_HEADERS = [
    'X-Request-Id',
    'X-Response-Time',
    SIMULATED_HEADER,
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'RateLimit-Policy',
    'Retry-After',
    'Allow',
] as const;

export const ERROR_CODES = {
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
    INVALID_PARAMETER: 'INVALID_PARAMETER',
    INVALID_ID: 'INVALID_ID',
    INVALID_JSON: 'INVALID_JSON',
    UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONFLICT: 'CONFLICT',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    MISSING_TOKEN: 'MISSING_TOKEN',
    INVALID_AUTH_HEADER: 'INVALID_AUTH_HEADER',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    FORBIDDEN: 'FORBIDDEN',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SIMULATED_STATUS: 'SIMULATED_STATUS',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

/** Public prefix for user-built mock API runtime URLs: `/api/v1/mock-apis/:projectId/...`. */
export const MOCK_RUNTIME_PREFIX = '/api/v1/mock-apis';

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
