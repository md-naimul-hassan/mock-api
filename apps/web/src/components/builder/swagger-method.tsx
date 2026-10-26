import type { HttpMethod } from '@/lib/request';
import { cn } from '@/lib/utils';

/** Swagger UI–style method colors (text + soft fill + left accent). */
const swaggerMethod: Record<
    HttpMethod,
    { text: string; fill: string; border: string; bar: string; openBg: string }
> = {
    GET: {
        text: 'text-emerald-700 dark:text-emerald-300',
        fill: 'bg-emerald-500/15',
        border: 'border-emerald-500/35',
        bar: 'bg-emerald-500',
        openBg: 'bg-emerald-500/[0.06]',
    },
    POST: {
        text: 'text-sky-700 dark:text-sky-300',
        fill: 'bg-sky-500/15',
        border: 'border-sky-500/35',
        bar: 'bg-sky-500',
        openBg: 'bg-sky-500/[0.06]',
    },
    PUT: {
        text: 'text-amber-700 dark:text-amber-300',
        fill: 'bg-amber-500/15',
        border: 'border-amber-500/35',
        bar: 'bg-amber-500',
        openBg: 'bg-amber-500/[0.06]',
    },
    PATCH: {
        text: 'text-violet-700 dark:text-violet-300',
        fill: 'bg-violet-500/15',
        border: 'border-violet-500/35',
        bar: 'bg-violet-500',
        openBg: 'bg-violet-500/[0.06]',
    },
    DELETE: {
        text: 'text-rose-700 dark:text-rose-300',
        fill: 'bg-rose-500/15',
        border: 'border-rose-500/35',
        bar: 'bg-rose-500',
        openBg: 'bg-rose-500/[0.06]',
    },
};

export function swaggerTone(method: HttpMethod) {
    return swaggerMethod[method];
}

export function SwaggerMethodLabel({ method, className }: { method: HttpMethod; className?: string }) {
    const tone = swaggerMethod[method];
    return (
        <span
            className={cn(
                'inline-flex w-[4.5rem] shrink-0 justify-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide',
                tone.fill,
                tone.text,
                className,
            )}
        >
            {method}
        </span>
    );
}
