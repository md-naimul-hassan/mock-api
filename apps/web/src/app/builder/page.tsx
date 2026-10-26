'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FolderPlus, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BuilderAuthGate } from '@/components/builder/builder-auth-gate';
import { Button, buttonClasses } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { CopyButton } from '@/components/ui/copy-button';
import { builderApi, projectShareUrl, type BuilderProject } from '@/lib/builder-api';

function Dashboard() {
    const [projects, setProjects] = useState<BuilderProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const result = await builderApi.listProjects();
            setProjects(result.projects);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    async function onCreate(event: FormEvent) {
        event.preventDefault();
        setCreating(true);
        try {
            const project = await builderApi.createProject({ name, description });
            toast.success('Mock API created');
            setName('');
            setDescription('');
            setProjects((current) => [project, ...current]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not create project');
        } finally {
            setCreating(false);
        }
    }

    async function onDuplicate(id: string) {
        try {
            const project = await builderApi.duplicateProject(id);
            toast.success('Project duplicated');
            await refresh();
            return project;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Duplicate failed');
            return null;
        }
    }

    async function onDelete(id: string, projectName: string) {
        if (!window.confirm(`Delete “${projectName}” and all of its endpoints? This cannot be undone.`)) return;
        try {
            await builderApi.deleteProject(id);
            toast.success('Project deleted');
            setProjects((current) => current.filter((project) => project.id !== id));
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Delete failed');
        }
    }

    return (
        <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6">
            <div className="max-w-3xl">
                <h1 className="text-3xl font-semibold tracking-tight">API Builder</h1>
                <p className="mt-2 text-muted">
                    Create custom mock APIs with your own paths, status codes, and JSON responses. Share the generated URLs with any frontend client.
                </p>
            </div>

            <section className="mt-10 max-w-xl rounded-lg border border-border bg-surface p-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <FolderPlus className="size-5 text-accent" aria-hidden />
                    New mock API
                </h2>
                <form onSubmit={onCreate} className="mt-4 space-y-3">
                    <label className="block text-sm">
                        <span className="mb-1 block text-muted">Name</span>
                        <input
                            required
                            maxLength={80}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Checkout API"
                            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                    </label>
                    <label className="block text-sm">
                        <span className="mb-1 block text-muted">Description (optional)</span>
                        <textarea
                            maxLength={500}
                            rows={2}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                    </label>
                    <Button type="submit" disabled={creating || !name.trim()}>
                        {creating ? 'Creating…' : 'Create mock API'}
                    </Button>
                </form>
            </section>

            <section className="mt-10">
                <h2 className="text-lg font-semibold">Your mock APIs</h2>
                {loading ? (
                    <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                        <LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading…
                    </p>
                ) : projects.length === 0 ? (
                    <Callout className="mt-4" variant="info">
                        You have not created any mock APIs yet. Use the form above to get started.
                    </Callout>
                ) : (
                    <ul className="mt-4 grid gap-3 md:grid-cols-2">
                        {projects.map((project) => {
                            const shareUrl = projectShareUrl(project.id);
                            return (
                                <li key={project.id} className="rounded-lg border border-border bg-surface p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <Link href={`/builder/projects/${project.id}`} className="text-base font-semibold hover:text-accent">
                                                {project.name}
                                            </Link>
                                            <p className="mt-1 text-sm text-muted">{project.description || 'No description'}</p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ${project.enabled ? 'bg-accent/15 text-accent' : 'bg-surface-2 text-muted'}`}
                                        >
                                            {project.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <code className="min-w-0 flex-1 truncate rounded bg-code px-2 py-1 font-mono text-xs">{shareUrl}</code>
                                        <CopyButton value={shareUrl} label="Copy shareable docs link" className="shrink-0" />
                                    </div>
                                    <p className="mt-2 text-xs text-muted">{project.endpointCount} endpoint{project.endpointCount === 1 ? '' : 's'}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Link href={`/builder/projects/${project.id}`} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
                                            Open
                                        </Link>
                                        <Link href={shareUrl} className={buttonClasses({ size: 'sm', variant: 'outline' })} target="_blank">
                                            Public docs
                                        </Link>
                                        <Button type="button" size="sm" variant="outline" onClick={() => void onDuplicate(project.id)}>
                                            Duplicate
                                        </Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => void onDelete(project.id, project.name)}>
                                            Delete
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default function BuilderPage() {
    return (
        <BuilderAuthGate>
            <Dashboard />
        </BuilderAuthGate>
    );
}
