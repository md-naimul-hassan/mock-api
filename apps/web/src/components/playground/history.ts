import { TOKEN_PLACEHOLDERS } from '@/lib/demo-tokens';
import type { ApiResult } from '@/lib/http';
import type { RequestSpec } from '@/lib/request';

export interface HistoryEntry {
    id: string;
    at: number;
    request: RequestSpec;
    status?: number;
    error?: string;
    timeMs: number;
}

const STORAGE_KEY = 'mockapis:playground-history';
export const HISTORY_LIMIT = 25;

/** Authorization values are never persisted; restoring an entry fetches a fresh demo token instead. */
function scrub(request: RequestSpec): RequestSpec {
    return {
        ...request,
        headers: request.headers.map((header) => (header.key.trim().toLowerCase() === 'authorization' ? { ...header, value: `Bearer ${TOKEN_PLACEHOLDERS.accessToken}` } : header)),
    };
}

export function loadHistory(): HistoryEntry[] {
    try {
        const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
        return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
    } catch {
        return [];
    }
}

export function saveHistory(entries: HistoryEntry[]) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Storage full or unavailable: history is kept in memory only.
    }
}

export function createHistoryEntry(request: RequestSpec, result: ApiResult): HistoryEntry {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: Date.now(),
        request: scrub(request),
        status: result.ok ? result.status : undefined,
        error: result.ok ? undefined : result.error,
        timeMs: result.timeMs,
    };
}
