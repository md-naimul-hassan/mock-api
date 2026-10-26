import { type Request } from 'express';
import { ALLOWED_TEST_STATUS_CODES } from '@mockapis/api-spec';
import ApiError from '../../../errors/ApiErrors';

const SENSITIVE_HEADER = /authorization|cookie|token|secret|password|api[-_]?key|session|forwarded|x-real-ip|cf-connecting-ip|true-client-ip/i;
const SENSITIVE_FIELD = /pass(word)?|token|secret|api[-_]?key|authorization|cookie|credit.?card|cvv|ssn/i;
const REDACTED = '[redacted]';

const redactBody = (value: unknown, path: string, redacted: string[], depth = 0): unknown => {
    if (depth > 20) return value;
    if (Array.isArray(value)) return value.map((item, index) => redactBody(item, `${path}[${index}]`, redacted, depth + 1));
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, inner]) => {
                if (SENSITIVE_FIELD.test(key)) {
                    redacted.push(`${path}.${key}`);
                    return [key, REDACTED];
                }
                return [key, redactBody(inner, `${path}.${key}`, redacted, depth + 1)];
            }),
        );
    }
    return value;
};

/** Mirrors the request back with secrets removed. Output is deterministic for identical requests. */
const echoRequest = (req: Request) => {
    const redacted: string[] = [];
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(req.headers)) {
        if (value === undefined) continue;
        if (SENSITIVE_HEADER.test(name)) {
            headers[name] = REDACTED;
            redacted.push(`headers.${name}`);
        } else {
            headers[name] = Array.isArray(value) ? value.join(', ') : value;
        }
    }
    const body = req.body === undefined ? null : redactBody(req.body, 'body', redacted);
    return {
        method: req.method,
        path: req.path === '/' ? req.baseUrl : `${req.baseUrl}${req.path}`,
        query: req.query,
        headers,
        body,
        contentType: req.get('content-type') ?? null,
        redacted,
    };
};

const assertAllowedStatus = (code: number) => {
    if (!(ALLOWED_TEST_STATUS_CODES as readonly number[]).includes(code)) {
        throw ApiError.badRequest(`Status code ${code} is not supported. Allowed codes: ${ALLOWED_TEST_STATUS_CODES.join(', ')}`, [
            { path: 'code', message: `Must be one of: ${ALLOWED_TEST_STATUS_CODES.join(', ')}` },
        ]);
    }
};

export const TestingService = { echoRequest, assertAllowedStatus };
