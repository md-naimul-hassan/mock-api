'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, KeyRound, Play, RotateCcw, Square } from 'lucide-react';
import { usesTokenPlaceholder } from '@/lib/demo-tokens';
import { methodAllowsBody, parseJsonBody, type RequestSpec } from '@/lib/request';
import { cn } from '@/lib/utils';
import { MethodBadge } from '../ui/badges';
import { Button, buttonClasses } from '../ui/button';
import { KeyValueEditor } from '../ui/key-value-editor';
import { ResponseViewer } from './response-viewer';
import { useRequestRunner } from './use-request-runner';

interface TryItProps {
    endpointId: string;
    success: RequestSpec;
    failure?: { request: RequestSpec; status: number };
}

type ExampleKind = 'success' | 'failure';

export function TryIt({ endpointId, success, failure }: TryItProps) {
    const id = useId();
    const [kind, setKind] = useState<ExampleKind>('success');
    const [request, setRequest] = useState<RequestSpec>(success);
    const { state, run, cancel, reset } = useRequestRunner();

    const original = kind === 'success' ? success : failure!.request;
    const allowsBody = methodAllowsBody(request.method);
    const bodyCheck = parseJsonBody(request.body);
    const needsToken = usesTokenPlaceholder(request);

    const load = (next: ExampleKind) => {
        setKind(next);
        setRequest(next === 'success' ? success : failure!.request);
        reset();
    };

    return (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            {failure ? (
                <div role="radiogroup" aria-label="Example to try" className="inline-flex rounded-md border border-border p-0.5 text-xs">
                    {(['success', 'failure'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={kind === option}
                            onClick={() => load(option)}
                            className={cn('rounded px-2.5 py-1 font-medium', kind === option ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')}
                        >
                            {option === 'success' ? 'Success example' : `Error example (${failure.status})`}
                        </button>
                    ))}
                </div>
            ) : null}

            <div className="flex items-center gap-2">
                <MethodBadge method={request.method} />
                <label htmlFor={`${id}-url`} className="sr-only">
                    Request URL
                </label>
                <input
                    id={`${id}-url`}
                    value={request.url}
                    onChange={(event) => setRequest({ ...request, url: event.target.value })}
                    spellCheck={false}
                    className="h-9 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 font-mono text-xs focus-visible:border-accent focus-visible:outline-none"
                />
            </div>

            <fieldset>
                <legend className="mb-2 text-xs font-medium text-muted">Headers</legend>
                <KeyValueEditor
                    name="header"
                    rows={request.headers}
                    onChange={(headers) => setRequest({ ...request, headers })}
                    keyPlaceholder="Header name"
                    valuePlaceholder="Value"
                    addLabel="Add header"
                />
            </fieldset>

            {allowsBody ? (
                <div>
                    <label htmlFor={`${id}-body`} className="text-xs font-medium text-muted">
                        JSON body
                    </label>
                    <textarea
                        id={`${id}-body`}
                        value={request.body ?? ''}
                        onChange={(event) => setRequest({ ...request, body: event.target.value })}
                        rows={Math.min(14, Math.max(4, (request.body ?? '').split('\n').length + 1))}
                        spellCheck={false}
                        aria-invalid={!bodyCheck.valid}
                        aria-describedby={!bodyCheck.valid ? `${id}-body-error` : undefined}
                        className="mt-1 w-full rounded-md border border-border bg-bg p-3 font-mono text-xs focus-visible:border-accent focus-visible:outline-none"
                    />
                    {!bodyCheck.valid ? (
                        <p id={`${id}-body-error`} className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                            This body is not valid JSON. It will be sent as-is, so expect a 400 INVALID_JSON response.
                        </p>
                    ) : null}
                </div>
            ) : null}

            {needsToken ? (
                <p className="flex items-center gap-1.5 text-xs text-muted">
                    <KeyRound aria-hidden className="size-3.5" />
                    <code>{'{{accessToken}}'}</code> / <code>{'{{refreshToken}}'}</code> are replaced with a fresh demo token when you send.
                </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
                {state.status === 'loading' ? (
                    <Button variant="secondary" onClick={cancel}>
                        <Square aria-hidden className="size-3.5" />
                        Cancel
                    </Button>
                ) : (
                    <Button onClick={() => run(request)}>
                        <Play aria-hidden className="size-3.5" />
                        Send request
                    </Button>
                )}
                <Button
                    variant="ghost"
                    onClick={() => {
                        setRequest(original);
                        reset();
                    }}
                >
                    <RotateCcw aria-hidden className="size-3.5" />
                    Reset
                </Button>
                <Link href={`/playground?endpoint=${encodeURIComponent(endpointId)}${kind === 'failure' ? '&example=failure' : ''}`} className={buttonClasses({ variant: 'ghost' })}>
                    <ExternalLink aria-hidden className="size-3.5" />
                    Open in playground
                </Link>
            </div>

            <ResponseViewer state={state} />
        </div>
    );
}
