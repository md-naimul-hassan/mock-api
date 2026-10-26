'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import type { EndpointIndexEntry } from '@/lib/docs';
import { DOCS_NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { MethodBadge } from '../ui/badges';

function NavTree({ query, endpoints, onNavigate }: { query: string; endpoints: EndpointIndexEntry[]; onNavigate?: () => void }) {
    const pathname = usePathname();
    const term = query.trim().toLowerCase();

    const groups = useMemo(
        () => DOCS_NAV.map((group) => ({ ...group, items: group.items.filter((item) => !term || item.title.toLowerCase().includes(term)) })).filter((group) => group.items.length),
        [term],
    );
    const matchingEndpoints = useMemo(
        () =>
            term
                ? endpoints.filter((endpoint) => `${endpoint.method} ${endpoint.path} ${endpoint.summary}`.toLowerCase().includes(term)).slice(0, 12)
                : [],
        [endpoints, term],
    );

    return (
        <div className="space-y-6">
            {groups.map((group) => (
                <div key={group.title}>
                    <h2 className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted uppercase">{group.title}</h2>
                    <ul className="space-y-0.5">
                        {group.items.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'block rounded-md px-2 py-1.5 text-sm transition-colors',
                                            active ? 'bg-accent/10 font-medium text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg',
                                        )}
                                    >
                                        {item.title}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
            {matchingEndpoints.length ? (
                <div>
                    <h2 className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted uppercase">Endpoints</h2>
                    <ul className="space-y-0.5">
                        {matchingEndpoints.map((endpoint) => (
                            <li key={endpoint.id}>
                                <Link href={endpoint.href} onClick={onNavigate} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-fg">
                                    <MethodBadge method={endpoint.method} className="w-14" />
                                    <span className="truncate font-mono">{endpoint.path.replace('/api/v1', '')}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
            {term && !groups.length && !matchingEndpoints.length ? <p className="px-2 text-sm text-muted">No pages or endpoints match “{query}”.</p> : null}
        </div>
    );
}

function SearchBox({ value, onChange, id }: { value: string; onChange: (value: string) => void; id: string }) {
    return (
        <div className="relative">
            <label htmlFor={id} className="sr-only">
                Search documentation
            </label>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
            <input
                id={id}
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search docs & endpoints"
                className="h-9 w-full rounded-md border border-border bg-surface pr-2 pl-8 text-sm placeholder:text-muted focus-visible:border-accent focus-visible:outline-none"
            />
        </div>
    );
}

export function DocsSidebar({ endpoints }: { endpoints: EndpointIndexEntry[] }) {
    const [query, setQuery] = useState('');
    return (
        <nav aria-label="Documentation" className="space-y-5">
            <SearchBox id="docs-search" value={query} onChange={setQuery} />
            <NavTree query={query} endpoints={endpoints} />
        </nav>
    );
}

/** Collapsible documentation navigation for small screens. */
export function DocsMobileNav({ endpoints }: { endpoints: EndpointIndexEntry[] }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const current = DOCS_NAV.flatMap((group) => group.items).find((item) => item.href === pathname)?.title ?? 'Documentation';

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <div className="mb-6 rounded-lg border border-border lg:hidden">
            <button
                type="button"
                aria-expanded={open}
                aria-controls="docs-mobile-nav"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
            >
                <span>
                    <span className="text-muted">Docs / </span>
                    {current}
                </span>
                <ChevronDown aria-hidden className={cn('size-4 transition-transform', open && 'rotate-180')} />
            </button>
            {open ? (
                <nav id="docs-mobile-nav" aria-label="Documentation" className="space-y-5 border-t border-border p-4">
                    <SearchBox id="docs-search-mobile" value={query} onChange={setQuery} />
                    <NavTree query={query} endpoints={endpoints} onNavigate={() => setOpen(false)} />
                </nav>
            ) : null}
        </div>
    );
}
