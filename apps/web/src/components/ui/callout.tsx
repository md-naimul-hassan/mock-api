import type { ReactNode } from 'react';
import { AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
    info: { icon: Info, className: 'border-sky-500/30 bg-sky-500/10', iconClass: 'text-sky-600 dark:text-sky-300' },
    warning: { icon: AlertTriangle, className: 'border-amber-500/40 bg-amber-500/10', iconClass: 'text-amber-600 dark:text-amber-300' },
    tip: { icon: Lightbulb, className: 'border-emerald-500/30 bg-emerald-500/10', iconClass: 'text-emerald-600 dark:text-emerald-300' },
};

export function Callout({ variant = 'info', title, children, className }: { variant?: keyof typeof variants; title?: string; children: ReactNode; className?: string }) {
    const { icon: Icon, className: tone, iconClass } = variants[variant];
    return (
        <div role={variant === 'warning' ? 'note' : undefined} className={cn('my-5 flex gap-3 rounded-lg border p-4 text-sm leading-relaxed', tone, className)}>
            <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', iconClass)} />
            <div className="min-w-0 [&_p]:mt-1 [&_p:first-child]:mt-0">
                {title ? <p className="font-semibold">{title}</p> : null}
                {children}
            </div>
        </div>
    );
}
