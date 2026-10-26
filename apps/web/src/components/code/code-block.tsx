import type { HighlightLanguage } from '@/lib/codegen';
import { highlightCode } from '@/lib/highlight';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/copy-button';

interface CodeBlockProps {
    code: string;
    lang: HighlightLanguage;
    title?: string;
    className?: string;
}

/** Server-rendered, syntax-highlighted code block with a copy button. */
export async function CodeBlock({ code, lang, title, className }: CodeBlockProps) {
    const html = await highlightCode(code, lang);
    return (
        <div className={cn('my-4 overflow-hidden rounded-lg border border-border bg-code', className)}>
            <div className="flex items-center justify-between border-b border-border px-3 py-1">
                <span className="text-xs text-muted">{title ?? lang}</span>
                <CopyButton value={code} label={`Copy ${title ?? 'code'}`} />
            </div>
            <div className="overflow-x-auto p-4" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
