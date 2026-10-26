'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LoaderCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { SwaggerDocs } from '@/components/builder/swagger-docs';
import { Playground } from '@/components/playground/playground';
import { buttonClasses } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { CopyButton } from '@/components/ui/copy-button';
import {
    builderApi,
    projectPublicUrl,
    projectShareUrl,
    type BuilderEndpoint,
    type BuilderPublicProject,
} from '@/lib/builder-api';
import { builderEndpointToRequest, builderPlaygroundPresets } from '@/lib/builder-docs';
import type { RequestSpec } from '@/lib/request';
import { cn } from '@/lib/utils';

type ShareView = 'docs' | 'playground';

export default function BuilderSharePage() {
    const params = useParams<{ id: string }>();
    const projectId = params.id;
    const [project, setProject] = useState<BuilderPublicProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<ShareView>('docs');
    const [playgroundEndpointId, setPlaygroundEndpointId] = useState<string | undefined>();

    const load = useCallback(async () => {
        if (!/^[a-fA-F0-9]{24}$/.test(projectId)) {
            setError('Invalid share link.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const detail = await builderApi.getPublicProject(projectId);
            setProject(detail);
        } catch (err) {
            setProject(null);
            setError(err instanceof Error ? err.message : 'Failed to load mock API');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void load();
    }, [load]);

    function openInPlayground(endpoint: BuilderEndpoint) {
        setPlaygroundEndpointId(endpoint.id);
        setView('playground');
    }

    const presets = useMemo(
        () => (project ? builderPlaygroundPresets(project.id, project.endpoints) : []),
        [project],
    );

    const playgroundInitial: RequestSpec = useMemo(() => {
        if (!project) return { method: 'GET', url: '', headers: [] };
        const focused =
            (playgroundEndpointId
                ? project.endpoints.find((endpoint) => endpoint.id === playgroundEndpointId)
                : undefined) ?? project.endpoints[0];
        if (focused) return builderEndpointToRequest(project.id, focused);
        return { method: 'GET', url: projectPublicUrl(project.id), headers: [] };
    }, [project, playgroundEndpointId]);

    if (loading) {
        return (
            <div className="mx-auto flex max-w-[90rem] items-center gap-2 px-4 py-16 text-sm text-muted sm:px-6">
                <LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading API docs…
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
                <Callout variant="warning">{error || 'This mock API is unavailable.'}</Callout>
                <Link href="/builder" className={cn(buttonClasses({ variant: 'secondary' }), 'mt-4')}>
                    Create your own mock API
                </Link>
            </div>
        );
    }

    const shareUrl = projectShareUrl(project.id);
    const initialPresetId = playgroundEndpointId ?? (project.endpoints[0] ? project.endpoints[0].id : undefined);

    return (
        <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Shared mock API</p>
            <header className="mt-2 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
                    {project.description ? <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p> : null}
                    <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Share link</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <code className="rounded border border-border bg-code px-2 py-1 font-mono text-xs">{shareUrl}</code>
                        <CopyButton value={shareUrl} label="Copy share link" showText />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={cn(buttonClasses({ variant: 'outline' }))}
                        onClick={() => {
                            void navigator.clipboard.writeText(shareUrl).then(
                                () => toast.success('Share link copied'),
                                () => toast.error('Could not copy'),
                            );
                        }}
                    >
                        <Share2 className="size-4" aria-hidden /> Copy share link
                    </button>
                    <Link href="/builder" className={cn(buttonClasses({ variant: 'secondary' }))}>
                        Build your own
                    </Link>
                </div>
            </header>

            <div
                role="tablist"
                aria-label="Shared API views"
                className="mt-8 inline-flex rounded-lg border border-border bg-surface p-1"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'docs'}
                    onClick={() => setView('docs')}
                    className={cn(
                        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                        view === 'docs' ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
                    )}
                >
                    API documentation
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={view === 'playground'}
                    onClick={() => setView('playground')}
                    className={cn(
                        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                        view === 'playground' ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
                    )}
                >
                    Playground
                </button>
            </div>

            {view === 'docs' ? (
                <section className="mt-6">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold tracking-tight">API documentation</h2>
                        <p className="mt-1 text-sm text-muted">
                            Expand an endpoint for details, or open it in the playground — no login required.
                        </p>
                    </div>
                    <SwaggerDocs
                        projectId={project.id}
                        endpoints={project.endpoints}
                        onOpenInPlayground={openInPlayground}
                    />
                </section>
            ) : (
                <section id="builder-playground" className="mt-6">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold tracking-tight">Playground</h2>
                        <p className="mt-1 text-sm text-muted">
                            Send live requests to this mock API, inspect responses, and copy generated client code. No account needed.
                        </p>
                    </div>
                    {project.endpoints.length === 0 ? (
                        <Callout variant="info">This mock API has no enabled endpoints to try yet.</Callout>
                    ) : (
                        <Playground
                            key={`${initialPresetId ?? 'none'}-${presets.map((preset) => preset.id).join(',')}`}
                            presets={presets}
                            initial={playgroundInitial}
                            initialPresetId={initialPresetId}
                        />
                    )}
                </section>
            )}
        </div>
    );
}
