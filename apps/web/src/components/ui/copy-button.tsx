'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
    value: string;
    label?: string;
    showText?: boolean;
    className?: string;
}

export function CopyButton({ value, label = 'Copy to clipboard', showText = false, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            toast.success('Copied to clipboard');
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Could not copy. Your browser blocked clipboard access.');
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={label}
            title={label}
            className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg',
                className,
            )}
        >
            {copied ? <Check aria-hidden className="size-3.5 text-emerald-500" /> : <Copy aria-hidden className="size-3.5" />}
            {showText ? <span>{copied ? 'Copied' : 'Copy'}</span> : null}
        </button>
    );
}
