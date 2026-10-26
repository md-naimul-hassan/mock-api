/**
 * Matches a request path against a pattern with `:param` segments.
 * Returns path params on success, or null when the pattern does not match.
 */
export function matchEndpointPath(pattern: string, requestPath: string): Record<string, string> | null {
    const normalize = (value: string) => {
        const withSlash = value.startsWith('/') ? value : `/${value}`;
        return withSlash.length > 1 && withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
    };
    const patternParts = normalize(pattern).split('/').slice(1);
    const requestParts = normalize(requestPath).split('/').slice(1);
    if (patternParts.length !== requestParts.length) return null;

    const params: Record<string, string> = {};
    for (let index = 0; index < patternParts.length; index += 1) {
        const expected = patternParts[index];
        const actual = requestParts[index];
        if (expected.startsWith(':') && expected.length > 1) {
            params[expected.slice(1)] = decodeURIComponent(actual);
            continue;
        }
        if (expected !== actual) return null;
    }
    return params;
}

/** Prefer concrete segments over params, then longer paths. */
export function rankEndpointMatch(pattern: string): number {
    const parts = pattern.split('/').filter(Boolean);
    const concrete = parts.filter((part) => !part.startsWith(':')).length;
    return concrete * 1000 + parts.length;
}
