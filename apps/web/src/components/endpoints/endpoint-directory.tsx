'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Play, Search, SearchX } from 'lucide-react';
import type { EndpointIndexEntry } from '@/lib/docs';
import { cn } from '@/lib/utils';
import { MethodBadge, Pill } from '../ui/badges';
import { Button } from '../ui/button';

const GROUPS = ['All', 'Data', 'CRUD', 'Authentication', 'Testing', 'System'] as const;
type GroupFilter = (typeof GROUPS)[number];

export function EndpointDirectory({ endpoints }: { endpoints: EndpointIndexEntry[] }) {
    const [query, setQuery] = useState('');
    const [group, setGroup] = useState<GroupFilter>('All');

    const counts = useMemo(() => Object.fromEntries(GROUPS.map((name) => [name, name === 'All' ? endpoints.length : endpoints.filter((endpoint) => endpoint.group === name).length])), [endpoints]);

    const filtered = useMemo(() => {
        const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        return endpoints.filter((endpoint) => {
            if (group !== 'All' && endpoint.group !== group) return false;
            const haystack = `${endpoint.method} ${endpoint.path} ${endpoint.summary} ${endpoint.sectionLabel}`.toLowerCase();
            return terms.every((term) => haystack.includes(term));
        });
    }, [endpoints, group, query]);

    const sections = useMemo(() => {
        const map = new Map<string, EndpointIndexEntry[]>();
        for (const endpoint of filtered) map.set(endpoint.sectionLabel, [...(map.get(endpoint.sectionLabel) ?? []), endpoint]);
        return [...map.entries()];
    }, [filtered]);

    return (
        <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <label htmlFor="endpoint-search" className="sr-only">
                        Search endpoints
                    </label>
                    <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                    <input
                        id="endpoint-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by path, method, or description (e.g. “post comments”)"
                        className="h-10 w-full rounded-md border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-muted focus-visible:border-accent focus-visible:outline-none"
                    />
                </div>
                <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-1.5">
                    {GROUPS.map((name) => (
                        <button
                            key={name}
                            type="button"
                            aria-pressed={group === name}
                            onClick={() => setGroup(name)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                group === name ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-fg',
                            )}
                        >
                            {name} <span className="opacity-70">{counts[name]}</span>
                        </button>
                    ))}
                </div>
            </div>

            <p className="mt-4 text-sm text-muted" aria-live="polite">
                {filtered.length === endpoints.length ? `${endpoints.length} endpoints` : `${filtered.length} of ${endpoints.length} endpoints`}
            </p>

            {sections.length === 0 ? (
                <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-border p-12 text-center">
                    <SearchX aria-hidden className="size-8 text-muted" />
                    <p className="mt-3 font-medium">No endpoints match your search</p>
                    <p className="mt-1 text-sm text-muted">Try a resource name like “users”, a method like “PATCH”, or clear the filters.</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                            setQuery('');
                            setGroup('All');
                        }}
                    >
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="mt-6 space-y-8">
                    {sections.map(([label, items]) => (
                        <section key={label} aria-labelledby={`dir-${label}`}>
                            <h2 id={`dir-${label}`} className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">
                                {label}
                            </h2>
                            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                                {items.map((endpoint) => (
                                    <li key={endpoint.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-bg px-4 py-3 hover:bg-surface">
                                        <MethodBadge method={endpoint.method} />
                                        <Link href={endpoint.href} className="min-w-0 flex-1">
                                            <code className="block truncate font-mono text-sm">{endpoint.path}</code>
                                            <span className="block text-sm text-muted">{endpoint.summary}</span>
                                        </Link>
                                        <span className="flex items-center gap-2">
                                            <Pill>{endpoint.group}</Pill>
                                            {endpoint.simulated ? <Pill>simulated</Pill> : null}
                                            {endpoint.requiresAuth ? <Pill>auth</Pill> : null}
                                            <Link
                                                href={`/playground?endpoint=${encodeURIComponent(endpoint.id)}`}
                                                aria-label={`Try ${endpoint.method} ${endpoint.path} in the playground`}
                                                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted hover:bg-surface-2 hover:text-fg"
                                            >
                                                <Play aria-hidden className="size-3" /> Try
                                            </Link>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
