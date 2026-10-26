import { effectiveHeaders, sendsBody, type RequestSpec } from './request';

export interface ApiResponse {
    ok: true;
    status: number;
    statusText: string;
    timeMs: number;
    headers: [string, string][];
    contentType: string | null;
    bodyText: string;
    json?: unknown;
    sizeBytes: number;
}

export interface ApiFailure {
    ok: false;
    timeMs: number;
    aborted: boolean;
    error: string;
}

export type ApiResult = ApiResponse | ApiFailure;

export interface SendOptions {
    signal?: AbortSignal;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/** Sends a real HTTP request from the browser and captures status, timing, headers, and body. */
export async function sendRequest(spec: RequestSpec, options: SendOptions = {}): Promise<ApiResult> {
    const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const onAbort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener('abort', onAbort, { once: true });

    const started = performance.now();
    try {
        let url: URL;
        try {
            url = new URL(spec.url);
        } catch {
            return { ok: false, timeMs: 0, aborted: false, error: 'Enter a full URL, including http:// or https://.' };
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return { ok: false, timeMs: 0, aborted: false, error: 'Only http:// and https:// URLs are supported.' };
        }

        const headers = new Headers();
        for (const header of effectiveHeaders(spec)) {
            try {
                headers.append(header.key, header.value);
            } catch {
                return { ok: false, timeMs: 0, aborted: false, error: `Invalid header: "${header.key}".` };
            }
        }

        const response = await fetchImpl(url.toString(), {
            method: spec.method,
            headers,
            body: sendsBody(spec) ? spec.body : undefined,
            signal: controller.signal,
            cache: 'no-store',
        });
        const bodyText = await response.text();
        const timeMs = Math.round(performance.now() - started);
        const contentType = response.headers.get('content-type');
        let json: unknown;
        if (bodyText && contentType?.includes('json')) {
            try {
                json = JSON.parse(bodyText);
            } catch {
                json = undefined;
            }
        }
        return {
            ok: true,
            status: response.status,
            statusText: response.statusText,
            timeMs,
            headers: [...response.headers.entries()],
            contentType,
            bodyText,
            json,
            sizeBytes: new TextEncoder().encode(bodyText).length,
        };
    } catch (error) {
        const timeMs = Math.round(performance.now() - started);
        if (controller.signal.aborted) {
            const timedOut = controller.signal.reason instanceof DOMException && controller.signal.reason.name === 'TimeoutError';
            return { ok: false, timeMs, aborted: !timedOut, error: timedOut ? 'The request timed out.' : 'The request was cancelled.' };
        }
        const detail = error instanceof Error ? ` (${error.message})` : '';
        return {
            ok: false,
            timeMs,
            aborted: false,
            error: `Network error${detail}. The API may be unreachable, the URL may be wrong, or the server did not allow this origin (CORS).`,
        };
    } finally {
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', onAbort);
    }
}

export function statusTone(status: number): 'success' | 'redirect' | 'client' | 'server' {
    if (status >= 500) return 'server';
    if (status >= 400) return 'client';
    if (status >= 300) return 'redirect';
    return 'success';
}
