'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, LoaderCircle, Plus, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { BuilderAuthGate } from '@/components/builder/builder-auth-gate';
import { EndpointEditor } from '@/components/builder/endpoint-editor';
import { SwaggerDocs } from '@/components/builder/swagger-docs';
import { Playground } from '@/components/playground/playground';
import { Button, buttonClasses } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { CopyButton } from '@/components/ui/copy-button';
import { builderApi, projectPublicUrl, projectShareUrl, type BuilderEndpoint, type BuilderProjectDetail } from '@/lib/builder-api';
import { builderEndpointToRequest, builderPlaygroundPresets } from '@/lib/builder-docs';
import type { RequestSpec } from '@/lib/request';
import { cn } from '@/lib/utils';

type ProjectView = 'docs' | 'playground';

function ProjectEditor() {
    const params = useParams<{ id: string }>();
    const projectId = params.id;
    const [project, setProject] = useState<BuilderProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [projectEnabled, setProjectEnabled] = useState(true);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editing, setEditing] = useState<BuilderEndpoint | null>(null);
    const [view, setView] = useState<ProjectView>('docs');
    const [playgroundEndpointId, setPlaygroundEndpointId] = useState<string | undefined>();

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const detail = await builderApi.getProject(projectId);
            setProject(detail);
            setProjectName(detail.name);
            setProjectDescription(detail.description);
            setProjectEnabled(detail.enabled);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load project');
            setProject(null);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    async function saveProjectMeta(event: FormEvent) {
        event.preventDefault();
        try {
            const updated = await builderApi.updateProject(projectId, {
                name: projectName,
                description: projectDescription,
                enabled: projectEnabled,
            });
            setProject((current) => (current ? { ...current, ...updated, endpoints: current.endpoints } : current));
            toast.success('Project updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Update failed');
        }
    }

    function openCreate() {
        setEditing(null);
        setEditorOpen(true);
    }

    function openEdit(endpoint: BuilderEndpoint) {
        setEditing(endpoint);
        setEditorOpen(true);
    }

    async function deleteEndpoint(endpoint: BuilderEndpoint) {
        if (!window.confirm(`Delete ${endpoint.method} ${endpoint.path}?`)) return;
        try {
            await builderApi.deleteEndpoint(projectId, endpoint.id);
            toast.success('Endpoint deleted');
            setProject((current) =>
                current
                    ? {
                          ...current,
                          endpoints: current.endpoints.filter((item) => item.id !== endpoint.id),
                          endpointCount: Math.max(0, current.endpointCount - 1),
                      }
                    : current,
            );
            setPlaygroundEndpointId((current) => (current === endpoint.id ? undefined : current));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Delete failed');
        }
    }

    function onEndpointSaved(saved: BuilderEndpoint) {
        setProject((current) => {
            if (!current) return current;
            const exists = current.endpoints.some((item) => item.id === saved.id);
            const endpoints = exists
                ? current.endpoints.map((item) => (item.id === saved.id ? saved : item))
                : [...current.endpoints, saved];
            return { ...current, endpoints, endpointCount: endpoints.length };
        });
    }

    async function copyShareLink() {
        if (!project) return;
        try {
            await navigator.clipboard.writeText(projectShareUrl(project.id));
            toast.success('Shareable docs link copied');
        } catch {
            toast.error('Could not copy share link');
        }
    }

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

    if (loading && !project) {
        return (
            <div className="mx-auto flex max-w-[90rem] items-center gap-2 px-4 py-16 text-sm text-muted sm:px-6">
                <LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading project…
            </div>
        );
    }

    if (!project) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
                <Callout variant="warning">Project not found or you do not have access.</Callout>
                <Link href="/builder" className={cn(buttonClasses({ variant: 'secondary' }), 'mt-4')}>
                    Back to dashboard
                </Link>
            </div>
        );
    }

    const shareUrl = projectShareUrl(project.id);
    const initialPresetId = playgroundEndpointId ?? (project.endpoints[0] ? project.endpoints[0].id : undefined);

    return (
        <div className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
            <Link href="/builder" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
                <ArrowLeft className="size-4" aria-hidden /> All mock APIs
            </Link>

            <header className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
                        <span
                            className={cn(
                                'rounded px-2 py-0.5 text-xs font-medium',
                                project.enabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-surface-2 text-muted',
                            )}
                        >
                            {project.enabled ? 'Online' : 'Disabled'}
                        </span>
                    </div>
                    {project.description ? <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p> : null}
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">Shareable docs</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <code className="rounded border border-border bg-code px-2 py-1 font-mono text-xs">{shareUrl}</code>
                        <CopyButton value={shareUrl} label="Copy shareable docs link" showText />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => void copyShareLink()}>
                        <Share2 className="size-4" aria-hidden /> Share docs
                    </Button>
                    <Button type="button" onClick={openCreate}>
                        <Plus className="size-4" aria-hidden /> Add endpoint
                    </Button>
                </div>
            </header>

            <form
                onSubmit={saveProjectMeta}
                className="mt-6 grid gap-3 rounded-lg border border-border bg-surface p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"
            >
                <label className="text-sm">
                    <span className="mb-1 block text-muted">Name</span>
                    <input
                        value={projectName}
                        onChange={(event) => setProjectName(event.target.value)}
                        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                </label>
                <label className="text-sm">
                    <span className="mb-1 block text-muted">Description</span>
                    <input
                        value={projectDescription}
                        onChange={(event) => setProjectDescription(event.target.value)}
                        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                </label>
                <label className="flex items-center gap-2 pb-2 text-sm">
                    <input type="checkbox" checked={projectEnabled} onChange={(event) => setProjectEnabled(event.target.checked)} />
                    Enabled
                </label>
                <Button type="submit" variant="secondary">
                    Save project
                </Button>
            </form>

            <div
                role="tablist"
                aria-label="Project views"
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
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">API documentation</h2>
                            <p className="mt-1 text-sm text-muted">
                                Expand an operation to inspect schemas, or open it in the playground to send live requests.
                            </p>
                        </div>
                        <Link href={shareUrl} target="_blank" className={cn(buttonClasses({ variant: 'ghost', size: 'sm' }))}>
                            Open public docs
                        </Link>
                    </div>
                    <SwaggerDocs
                        projectId={project.id}
                        endpoints={project.endpoints}
                        editable
                        onEdit={openEdit}
                        onDelete={(endpoint) => void deleteEndpoint(endpoint)}
                        onOpenInPlayground={openInPlayground}
                    />
                </section>
            ) : (
                <section id="builder-playground" className="mt-6">
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold tracking-tight">Playground</h2>
                        <p className="mt-1 text-sm text-muted">
                            Test your mock endpoints with real HTTP requests, inspect responses, and copy generated client code.
                        </p>
                    </div>
                    {project.endpoints.length === 0 ? (
                        <Callout variant="info">
                            <p>Create an endpoint first, then use the playground to send requests against it.</p>
                            <Button type="button" size="sm" className="mt-3" onClick={openCreate}>
                                <Plus className="size-3.5" aria-hidden /> Add endpoint
                            </Button>
                        </Callout>
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

            <EndpointEditor
                projectId={projectId}
                endpoint={editing}
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                onSaved={onEndpointSaved}
            />
        </div>
    );
}

export default function BuilderProjectPage() {
    return (
        <BuilderAuthGate>
            <ProjectEditor />
        </BuilderAuthGate>
    );
}
