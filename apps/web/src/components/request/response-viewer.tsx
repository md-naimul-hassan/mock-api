'use client';

import { Clock, HardDrive, Loader2, WifiOff } from 'lucide-react';
import { prettyJson } from '@/lib/json-tokens';
import { formatBytes } from '@/lib/utils';
import { JsonView } from '../code/json-view';
import { StatusBadge } from '../ui/badges';
import { CopyButton } from '../ui/copy-button';
import { Tabs } from '../ui/tabs';
import type { RunnerState } from './use-request-runner';

const REASONS: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    410: 'Gone',
    413: 'Payload Too Large',
    415: 'Unsupported Media Type',
    418: "I'm a Teapot",
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
};

export function ResponseViewer({ state, emptyHint = 'Send the request to see a live response.' }: { state: RunnerState; emptyHint?: string }) {
    if (state.status === 'idle') {
        return <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">{emptyHint}</div>;
    }
    if (state.status === 'loading') {
        return (
            <div role="status" className="flex min-h-32 items-center justify-center gap-2 rounded-lg border border-border p-6 text-sm text-muted">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                Waiting for response…
            </div>
        );
    }

    const { result } = state;
    if (!result.ok) {
        return (
            <div role="alert" className="flex gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm">
                <WifiOff aria-hidden className="mt-0.5 size-4 shrink-0 text-rose-500" />
                <div>
                    <p className="font-semibold">No response received</p>
                    <p className="mt-1 text-muted">{result.error}</p>
                </div>
            </div>
        );
    }

    const body = result.json !== undefined ? prettyJson(result.json) : result.bodyText;

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-code" aria-live="polite">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border px-3 py-2 text-xs text-muted">
                <span className="sr-only">Response status</span>
                <StatusBadge status={result.status} label={result.statusText || REASONS[result.status]} />
                <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden className="size-3.5" />
                    {result.timeMs} ms
                </span>
                <span className="inline-flex items-center gap-1">
                    <HardDrive aria-hidden className="size-3.5" />
                    {formatBytes(result.sizeBytes)}
                </span>
            </div>
            <Tabs
                label="Response"
                listClassName="px-2"
                actions={<CopyButton value={body} label="Copy response body" />}
                items={[
                    {
                        id: 'body',
                        label: 'Body',
                        content: (
                            <div className="max-h-[28rem] overflow-auto p-4">
                                {!body ? (
                                    <p className="text-sm text-muted">Empty body{result.status === 204 ? ' (204 No Content)' : ''}.</p>
                                ) : result.json !== undefined ? (
                                    <JsonView text={body} />
                                ) : (
                                    <pre className="font-mono text-xs whitespace-pre-wrap break-all">{body}</pre>
                                )}
                            </div>
                        ),
                    },
                    {
                        id: 'headers',
                        label: `Headers (${result.headers.length})`,
                        content: (
                            <div className="max-h-[28rem] overflow-auto p-4">
                                <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-1 font-mono text-xs">
                                    {result.headers.map(([name, value]) => (
                                        <div key={name} className="contents">
                                            <dt className="text-muted">{name}</dt>
                                            <dd className="break-all">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <p className="mt-3 text-xs text-muted">Browsers only expose CORS-safelisted headers and the headers the API lists in Access-Control-Expose-Headers.</p>
                            </div>
                        ),
                    },
                ]}
            />
        </div>
    );
}
