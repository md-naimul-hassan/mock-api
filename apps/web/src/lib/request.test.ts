import { describe, expect, it } from 'vitest';
import { substituteTokens, usesTokenPlaceholder } from './demo-tokens';
import { tokenizeJson } from './json-tokens';
import { effectiveHeaders, joinUrl, parseJsonBody, splitUrl } from './request';

describe('URL helpers', () => {
    it('splits and joins query strings without losing empty rows', () => {
        const { base, query } = splitUrl('http://api.test/users?limit=2&select=id,email&=');
        expect(base).toBe('http://api.test/users');
        expect(query).toEqual([
            { key: 'limit', value: '2' },
            { key: 'select', value: 'id,email' },
            { key: '', value: '' },
        ]);
        expect(joinUrl(base, query)).toBe('http://api.test/users?limit=2&select=id,email&=');
        expect(joinUrl(base, [])).toBe(base);
    });

    it('encodes special characters and decodes them back', () => {
        const url = joinUrl('http://api.test/search', [{ key: 'q', value: 'a&b c' }]);
        expect(url).toBe('http://api.test/search?q=a%26b%20c');
        expect(splitUrl(url).query).toEqual([{ key: 'q', value: 'a&b c' }]);
    });
});

describe('request helpers', () => {
    it('adds a JSON content type only when a body is sent', () => {
        expect(effectiveHeaders({ method: 'POST', url: 'x', headers: [], body: '{}' })).toEqual([{ key: 'Content-Type', value: 'application/json' }]);
        expect(effectiveHeaders({ method: 'GET', url: 'x', headers: [], body: '{}' })).toEqual([]);
        expect(effectiveHeaders({ method: 'POST', url: 'x', headers: [{ key: 'content-type', value: 'text/plain' }], body: 'hi' })).toEqual([
            { key: 'content-type', value: 'text/plain' },
        ]);
    });

    it('validates JSON bodies', () => {
        expect(parseJsonBody('')).toEqual({ valid: true });
        expect(parseJsonBody('{"a":1}')).toEqual({ valid: true, value: { a: 1 } });
        expect(parseJsonBody('{').valid).toBe(false);
    });
});

describe('demo token placeholders', () => {
    it('detects and substitutes placeholders everywhere', () => {
        const spec = {
            method: 'POST' as const,
            url: 'http://api.test/auth/refresh',
            headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }],
            body: '{"refreshToken":"{{refreshToken}}"}',
        };
        expect(usesTokenPlaceholder(spec)).toBe(true);
        const substituted = substituteTokens(spec, { accessToken: 'AAA', refreshToken: 'RRR' });
        expect(substituted.headers[0].value).toBe('Bearer AAA');
        expect(substituted.body).toBe('{"refreshToken":"RRR"}');
        expect(usesTokenPlaceholder(substituted)).toBe(false);
    });
});

describe('tokenizeJson', () => {
    it('classifies keys, strings, numbers, booleans, and null', () => {
        const tokens = tokenizeJson('{"a": "b", "n": -1.5e3, "t": true, "z": null}').filter((token) => token.type !== 'whitespace' && token.type !== 'punctuation');
        expect(tokens).toEqual([
            { type: 'key', value: '"a"' },
            { type: 'string', value: '"b"' },
            { type: 'key', value: '"n"' },
            { type: 'number', value: '-1.5e3' },
            { type: 'key', value: '"t"' },
            { type: 'boolean', value: 'true' },
            { type: 'key', value: '"z"' },
            { type: 'null', value: 'null' },
        ]);
    });

    it('round-trips the original text', () => {
        const text = JSON.stringify({ nested: { list: [1, 'two', false] }, quote: 'say "hi"' }, null, 2);
        expect(
            tokenizeJson(text)
                .map((token) => token.value)
                .join(''),
        ).toBe(text);
    });
});
