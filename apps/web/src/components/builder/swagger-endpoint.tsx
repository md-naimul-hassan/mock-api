'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Pencil, Share2, Terminal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { JsonView } from '@/components/code/json-view';
import { SwaggerMethodLabel, swaggerTone } from '@/components/builder/swagger-method';
import { SwaggerTryIt } from '@/components/builder/swagger-try-it';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { StatusBadge } from '@/components/ui/badges';
import type { BuilderEndpoint } from '@/lib/builder-api';
import { projectShareUrl } from '@/lib/builder-api';
import { asRequestMethod, extractPathParams } from '@/lib/builder-docs';
import { cn } from '@/lib/utils';

type Props = {
    projectId: string;
    endpoint: BuilderEndpoint;
    editable?: boolean;
    defaultOpen?: boolean;
    onEdit?: (endpoint: BuilderEndpoint) => void;
    onDelete?: (endpoint: BuilderEndpoint) => void;
    onOpenInPlayground?: (endpoint: BuilderEndpoint) => void;
};

export function SwaggerEndpoint({
    projectId,
    endpoint,
    editable = false,
    defaultOpen = false,
    onEdit,
    onDelete,
    onOpenInPlayground,
}: Props) {
    const [open, setOpen] = useState(defaultOpen);
    const [trying, setTrying] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.location.hash === `#endpoint-${endpoint.id}`) {
            setOpen(true);
            requestAnimationFrame(() => {
                document.getElementById(`endpoint-${endpoint.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }, [endpoint.id]);
    const method = asRequestMethod(endpoint.method);
    const tone = swaggerTone(method);
    const pathParams = extractPathParams(endpoint.path);
    const shareEndpointUrl = `${projectShareUrl(projectId)}#endpoint-${endpoint.id}`;
    const exampleRequestBody =
        endpoint.requestBody === undefined || endpoint.requestBody === null
            ? ''
            : typeof endpoint.requestBody === 'string'
              ? endpoint.requestBody
              : JSON.stringify(endpoint.requestBody, null, 2);
    const exampleBody =
        endpoint.responseBody === undefined
            ? ''
            : typeof endpoint.responseBody === 'string'
              ? endpoint.responseBody
              : JSON.stringify(endpoint.responseBody, null, 2);

    async function copyShare() {
        try {
            await navigator.clipboard.writeText(shareEndpointUrl);
            toast.success('Share link copied');
        } catch {
            toast.error('Could not copy share link');
        }
    }

    return (
        <article
            id={`endpoint-${endpoint.id}`}
            className={cn('overflow-hidden rounded-md border', tone.border, open ? tone.openBg : 'bg-surface')}
        >
            <div className={cn('flex', open ? '' : '')}>
                <div className={cn('w-1 shrink-0 self-stretch', tone.bar)} aria-hidden />
                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                >
                    <SwaggerMethodLabel method={method} />
                    <code className="min-w-0 truncate font-mono text-sm font-medium">{endpoint.path}</code>
                    {!endpoint.enabled ? (
                        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                            off
                        </span>
                    ) : null}
                    <span className="ml-auto hidden min-w-0 truncate text-sm text-muted sm:block">
                        {endpoint.description || 'No description'}
                    </span>
                    <ChevronDown
                        className={cn('size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
                        aria-hidden
                    />
                </button>
            </div>

            {open ? (
                <div className="space-y-5 border-t border-border/80 px-4 py-4 sm:px-5">
                    <p className="text-sm leading-6 text-muted sm:hidden">{endpoint.description || 'No description'}</p>

                    <div className="flex flex-wrap items-center gap-2">
                        {onOpenInPlayground ? (
                            <Button type="button" size="sm" variant="secondary" onClick={() => onOpenInPlayground(endpoint)}>
                                <Terminal className="size-3.5" aria-hidden /> Playground
                            </Button>
                        ) : null}
                        <Button type="button" size="sm" variant="outline" onClick={() => void copyShare()}>
                            <Share2 className="size-3.5" aria-hidden /> Share
                        </Button>
                        <CopyButton value={shareEndpointUrl} label="Copy shareable docs link" showText />
                        {editable ? (
                            <>
                                <Button type="button" size="sm" variant="secondary" onClick={() => onEdit?.(endpoint)}>
                                    <Pencil className="size-3.5" aria-hidden /> Edit
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => onDelete?.(endpoint)}>
                                    <Trash2 className="size-3.5" aria-hidden /> Delete
                                </Button>
                            </>
                        ) : null}
                    </div>

                    {pathParams.length > 0 ? (
                        <section>
                            <h4 className="text-sm font-semibold">Parameters</h4>
                            <div className="mt-2 overflow-x-auto rounded-md border border-border">
                                <table className="w-full min-w-[28rem] text-left text-sm">
                                    <thead className="bg-surface-2/60 text-xs text-muted">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Name</th>
                                            <th className="px-3 py-2 font-medium">In</th>
                                            <th className="px-3 py-2 font-medium">Required</th>
                                            <th className="px-3 py-2 font-medium">Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pathParams.map((name) => (
                                            <tr key={name} className="border-t border-border">
                                                <td className="px-3 py-2 font-mono text-xs">{name}</td>
                                                <td className="px-3 py-2 text-muted">path</td>
                                                <td className="px-3 py-2">
                                                    <span className="text-rose-600 dark:text-rose-300">true</span>
                                                </td>
                                                <td className="px-3 py-2 text-muted">string</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : null}

                    {exampleRequestBody ? (
                        <section>
                            <h4 className="text-sm font-semibold">Request body</h4>
                            <div className="mt-2 overflow-hidden rounded-md border border-border">
                                <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-2/50 px-3 py-2">
                                    <span className="text-xs text-muted">application/json</span>
                                    <CopyButton value={exampleRequestBody} label="Copy example request body" />
                                </div>
                                <div className="max-h-64 overflow-auto bg-code p-3">
                                    <JsonView text={exampleRequestBody} />
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {Object.keys(endpoint.responseHeaders).length > 0 ? (
                        <section>
                            <h4 className="text-sm font-semibold">Response headers</h4>
                            <ul className="mt-2 space-y-1 text-sm">
                                {Object.entries(endpoint.responseHeaders).map(([key, value]) => (
                                    <li key={key} className="flex flex-wrap gap-2 font-mono text-xs">
                                        <span className="font-semibold">{key}</span>
                                        <span className="text-muted">{value}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <section>
                        <h4 className="text-sm font-semibold">Responses</h4>
                        <div className="mt-2 overflow-hidden rounded-md border border-border">
                            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2/50 px-3 py-2">
                                <StatusBadge status={endpoint.statusCode} />
                                <span className="text-sm text-muted">Configured mock response</span>
                                {endpoint.delayMs > 0 ? (
                                    <span className="text-xs text-muted">· delay {endpoint.delayMs}ms</span>
                                ) : null}
                                {exampleBody ? (
                                    <CopyButton value={exampleBody} label="Copy example response" className="ml-auto" />
                                ) : null}
                            </div>
                            {exampleBody ? (
                                <div className="max-h-80 overflow-auto bg-code p-3">
                                    <JsonView text={exampleBody} />
                                </div>
                            ) : (
                                <p className="p-3 text-sm text-muted">Empty response body.</p>
                            )}
                        </div>
                    </section>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant={trying ? 'secondary' : 'primary'}
                            onClick={() => setTrying((value) => !value)}
                        >
                            {trying ? 'Hide Try it out' : 'Try it out'}
                        </Button>
                    </div>

                    {trying ? <SwaggerTryIt projectId={projectId} endpoint={endpoint} /> : null}
                </div>
            ) : null}
        </article>
    );
}
