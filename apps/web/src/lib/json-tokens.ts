export type JsonTokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'whitespace' | 'text';

export interface JsonToken {
    type: JsonTokenType;
    value: string;
}

const TOKEN_PATTERN = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false)\b|\b(null)\b|([{}[\],:])|(\s+)/g;

/** Splits pretty-printed JSON into typed tokens for syntax highlighting. Unknown text is kept as `text`. */
export function tokenizeJson(source: string): JsonToken[] {
    const tokens: JsonToken[] = [];
    let lastIndex = 0;
    for (const match of source.matchAll(TOKEN_PATTERN)) {
        const index = match.index ?? 0;
        if (index > lastIndex) tokens.push({ type: 'text', value: source.slice(lastIndex, index) });
        const [full, str, colon, num, bool, nil, punct, space] = match;
        if (str !== undefined) {
            if (colon) {
                tokens.push({ type: 'key', value: str });
                tokens.push({ type: 'punctuation', value: colon });
            } else {
                tokens.push({ type: 'string', value: str });
            }
        } else if (num !== undefined) tokens.push({ type: 'number', value: num });
        else if (bool !== undefined) tokens.push({ type: 'boolean', value: bool });
        else if (nil !== undefined) tokens.push({ type: 'null', value: nil });
        else if (punct !== undefined) tokens.push({ type: 'punctuation', value: punct });
        else if (space !== undefined) tokens.push({ type: 'whitespace', value: space });
        lastIndex = index + full.length;
    }
    if (lastIndex < source.length) tokens.push({ type: 'text', value: source.slice(lastIndex) });
    return tokens;
}

export function prettyJson(value: unknown) {
    return JSON.stringify(value, null, 2);
}
