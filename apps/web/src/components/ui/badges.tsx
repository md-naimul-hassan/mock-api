import type { ReactNode } from 'react';
import { statusTone } from '@/lib/http';
import type { HttpMethod } from '@/lib/request';
import { cn } from '@/lib/utils';

const methodColors: Record<HttpMethod, string> = {
    GET: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30',
    POST: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30',
    PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30',
    PATCH: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/30',
    DELETE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30',
};

export function MethodBadge({ method, className }: { method: HttpMethod; className?: string }) {
    return (
        <span className={cn('inline-flex w-16 shrink-0 justify-center rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ring-1 ring-inset', methodColors[method], className)}>
            {method}
        </span>
    );
}

const toneColors = {
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30',
    redirect: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30',
    client: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30',
    server: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30',
};

export function StatusBadge({ status, label, className }: { status: number; label?: string; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs font-semibold ring-1 ring-inset', toneColors[statusTone(status)], className)}>
            {status}
            {label ? <span className="font-sans font-medium">{label}</span> : null}
        </span>
    );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
    return <span className={cn('inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted', className)}>{children}</span>;
}
