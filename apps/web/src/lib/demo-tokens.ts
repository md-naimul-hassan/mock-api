import { DEMO_CREDENTIALS } from '@mockapis/api-spec/constants';
import { API_BASE_URL, API_PREFIX } from './site';
import type { RequestSpec } from './request';

export const TOKEN_PLACEHOLDERS = { accessToken: '{{accessToken}}', refreshToken: '{{refreshToken}}' } as const;

export interface DemoTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

const STORAGE_KEY = 'mockapis:demo-tokens';

export function usesTokenPlaceholder(spec: RequestSpec) {
    const text = [spec.url, spec.body ?? '', ...spec.headers.map((header) => header.value)].join('\n');
    return text.includes(TOKEN_PLACEHOLDERS.accessToken) || text.includes(TOKEN_PLACEHOLDERS.refreshToken);
}

export function substituteTokens(spec: RequestSpec, tokens: Pick<DemoTokens, 'accessToken' | 'refreshToken'>): RequestSpec {
    const replace = (value: string) => value.split(TOKEN_PLACEHOLDERS.accessToken).join(tokens.accessToken).split(TOKEN_PLACEHOLDERS.refreshToken).join(tokens.refreshToken);
    return {
        ...spec,
        url: replace(spec.url),
        body: spec.body === undefined ? undefined : replace(spec.body),
        headers: spec.headers.map((header) => ({ ...header, value: replace(header.value) })),
    };
}

function readCached(): DemoTokens | undefined {
    try {
        const cached = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as DemoTokens | null;
        if (cached && cached.expiresAt - Date.now() > 60_000) return cached;
    } catch {
        // Ignore unavailable or corrupted storage.
    }
    return undefined;
}

/**
 * Logs in with the public demo credentials to obtain short-lived demo tokens.
 * Tokens are cached in sessionStorage only for the current tab.
 */
export async function getDemoTokens(options: { fresh?: boolean; fetchImpl?: typeof fetch } = {}): Promise<DemoTokens> {
    if (!options.fresh) {
        const cached = readCached();
        if (cached) return cached;
    }
    const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    const response = await fetchImpl(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_CREDENTIALS.admin, expiresInMins: 30 }),
    });
    if (!response.ok) throw new Error(`Demo login failed with status ${response.status}`);
    const body = (await response.json()) as { accessToken: string; refreshToken: string; expiresIn: number };
    const tokens = { accessToken: body.accessToken, refreshToken: body.refreshToken, expiresAt: Date.now() + body.expiresIn * 1000 };
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
        // Storage may be unavailable (private mode); tokens still work for this request.
    }
    return tokens;
}
