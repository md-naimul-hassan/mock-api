'use client';

import { useEffect, useState } from 'react';
import type { HighlightLanguage } from '@/lib/codegen';
import { cn } from '@/lib/utils';

interface HighlightedCodeProps {
    code: string;
    lang: HighlightLanguage;
    /** Pre-rendered HTML for `code` (from the server). When omitted, highlighting happens in the browser. */
    html?: string;
    className?: string;
}

export function HighlightedCode({ code, lang, html, className }: HighlightedCodeProps) {
    const [clientHtml, setClientHtml] = useState<{ code: string; html: string }>();

    useEffect(() => {
        if (html) return;
        let cancelled = false;
        import('@/lib/highlight')
            .then(({ highlightCode }) => highlightCode(code, lang))
            .then((result) => {
                if (!cancelled) setClientHtml({ code, html: result });
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [code, lang, html]);

    const rendered = html ?? (clientHtml?.code === code ? clientHtml.html : undefined);
    return (
        <div className={cn('overflow-x-auto p-4', className)}>
            {rendered ? (
                <div dangerouslySetInnerHTML={{ __html: rendered }} />
            ) : (
                <pre className="shiki font-mono text-[0.8125rem] leading-[1.6]">
                    <code>{code}</code>
                </pre>
            )}
        </div>
    );
}
