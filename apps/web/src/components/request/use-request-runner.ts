'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getDemoTokens, substituteTokens, usesTokenPlaceholder } from '@/lib/demo-tokens';
import { sendRequest, type ApiResult } from '@/lib/http';
import type { RequestSpec } from '@/lib/request';

export type RunnerState = { status: 'idle' } | { status: 'loading' } | { status: 'done'; result: ApiResult; sent: RequestSpec };

/**
 * Sends real requests and tracks loading/result state. Requests containing
 * `{{accessToken}}` / `{{refreshToken}}` placeholders get fresh demo tokens first.
 */
export function useRequestRunner(onComplete?: (sent: RequestSpec, result: ApiResult) => void) {
    const [state, setState] = useState<RunnerState>({ status: 'idle' });
    const controller = useRef<AbortController | null>(null);

    useEffect(() => () => controller.current?.abort(), []);

    const run = useCallback(
        async (spec: RequestSpec) => {
            controller.current?.abort();
            const current = new AbortController();
            controller.current = current;
            setState({ status: 'loading' });

            let sent = spec;
            if (usesTokenPlaceholder(spec)) {
                try {
                    sent = substituteTokens(spec, await getDemoTokens());
                } catch {
                    toast.error('Could not get a demo token. Is the API reachable?');
                }
            }
            const result = await sendRequest(sent, { signal: current.signal });
            if (current.signal.aborted && result.ok === false && result.aborted) {
                setState({ status: 'idle' });
                return;
            }
            setState({ status: 'done', result, sent });
            onComplete?.(sent, result);
        },
        [onComplete],
    );

    const cancel = useCallback(() => {
        controller.current?.abort();
        setState({ status: 'idle' });
    }, []);

    const reset = useCallback(() => {
        controller.current?.abort();
        setState({ status: 'idle' });
    }, []);

    return { state, run, cancel, reset };
}
