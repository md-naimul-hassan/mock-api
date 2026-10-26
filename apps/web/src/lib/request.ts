export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface KeyValue {
    key: string;
    value: string;
}

/** A fully described HTTP request, used by code generation, the playground, and "Try it" panels. */
export interface RequestSpec {
    method: HttpMethod;
    url: string;
    headers: KeyValue[];
    body?: string;
}

export const methodAllowsBody = (method: HttpMethod) => method !== 'GET';

const encode = (value: string) => encodeURIComponent(value).replace(/%2C/gi, ',');

/** Splits a URL into the part before `?` and its query parameters (empty keys and values are preserved). */
export function splitUrl(url: string): { base: string; query: KeyValue[] } {
    const index = url.indexOf('?');
    if (index === -1) return { base: url, query: [] };
    const search = url.slice(index + 1);
    const query = search
        ? search.split('&').map((pair) => {
              const [rawKey, ...rest] = pair.split('=');
              return { key: safeDecode(rawKey), value: safeDecode(rest.join('=')) };
          })
        : [];
    return { base: url.slice(0, index), query };
}

function safeDecode(value: string) {
    try {
        return decodeURIComponent(value.replace(/\+/g, ' '));
    } catch {
        return value;
    }
}

export function joinUrl(base: string, query: KeyValue[]): string {
    if (query.length === 0) return base;
    return `${base}?${query.map(({ key, value }) => `${encode(key)}=${encode(value)}`).join('&')}`;
}

export function hasHeader(headers: KeyValue[], name: string) {
    return headers.some((header) => header.key.trim().toLowerCase() === name.toLowerCase());
}

/** Headers that are actually sent: blank names are dropped and a JSON content type is added when a body is present. */
export function effectiveHeaders(spec: RequestSpec): KeyValue[] {
    const headers = spec.headers.filter((header) => header.key.trim()).map((header) => ({ key: header.key.trim(), value: header.value }));
    if (sendsBody(spec) && !hasHeader(headers, 'content-type')) headers.push({ key: 'Content-Type', value: 'application/json' });
    return headers;
}

export const sendsBody = (spec: RequestSpec) => methodAllowsBody(spec.method) && !!spec.body?.trim();

/** Returns the parsed JSON body, or `undefined` if the body is empty or not valid JSON. */
export function parseJsonBody(body: string | undefined): { valid: boolean; value?: unknown } {
    if (!body?.trim()) return { valid: true };
    try {
        return { valid: true, value: JSON.parse(body) };
    } catch {
        return { valid: false };
    }
}
