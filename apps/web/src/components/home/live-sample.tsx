'use client';

import Link from 'next/link';
import { ExternalLink, Play, Square } from 'lucide-react';
import type { ResponseExampleView } from '@/lib/docs';
import type { RequestSpec } from '@/lib/request';
import { HighlightedCode } from '../code/highlighted-code';
import { SnippetTabs, type Snippet } from '../code/snippet-tabs';
import { ResponseViewer } from '../request/response-viewer';
import { useRequestRunner } from '../request/use-request-runner';
import { StatusBadge } from '../ui/badges';
import { Button, buttonClasses } from '../ui/button';

interface LiveSampleProps {
    endpointId: string;
    request: RequestSpec;
    snippets: Snippet[];
    sample?: ResponseExampleView & { html?: string };
}

export function LiveSample({ endpointId, request, snippets, sample }: LiveSampleProps) {
    const { state, run, cancel } = useRequestRunner();

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div className="min-w-0 space-y-3">
                <SnippetTabs snippets={snippets} title="Sample request" />
                <div className="flex flex-wrap gap-2">
                    {state.status === 'loading' ? (
                        <Button variant="secondary" onClick={cancel}>
                            <Square aria-hidden className="size-3.5" /> Cancel
                        </Button>
                    ) : (
                        <Button onClick={() => run(request)}>
                            <Play aria-hidden className="size-3.5" /> Run this request
                        </Button>
                    )}
                    <Link href={`/playground?endpoint=${endpointId}`} className={buttonClasses({ variant: 'outline' })}>
                        <ExternalLink aria-hidden className="size-3.5" /> Open in playground
                    </Link>
                </div>
            </div>
            <div className="min-w-0">
                {state.status === 'idle' && sample ? (
                    <div className="overflow-hidden rounded-lg border border-border bg-code">
                        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted">
                            <span className="flex items-center gap-2">
                                <StatusBadge status={sample.status} /> Sample response
                            </span>
                            <span>Run the request for a live response</span>
                        </div>
                        <HighlightedCode code={sample.body} lang="json" html={sample.html} className="max-h-[26rem]" />
                    </div>
                ) : (
                    <ResponseViewer state={state} />
                )}
            </div>
        </div>
    );
}
