'use client';

import type { HighlightLanguage } from '@/lib/codegen';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/copy-button';
import { Tabs } from '../ui/tabs';
import { HighlightedCode } from './highlighted-code';
import { usePreferredLanguage } from './use-preferred-language';

export interface Snippet {
    id: string;
    label: string;
    highlight: HighlightLanguage;
    code: string;
    html?: string;
}

export function SnippetTabs({ snippets, className, title = 'Code samples' }: { snippets: Snippet[]; className?: string; title?: string }) {
    const [language, setLanguage] = usePreferredLanguage();
    const active = snippets.find((snippet) => snippet.id === language) ?? snippets[0];

    return (
        <div className={cn('overflow-hidden rounded-lg border border-border bg-code', className)}>
            <Tabs
                label={title}
                value={active.id}
                onValueChange={setLanguage}
                listClassName="px-2"
                actions={<CopyButton value={active.code} label={`Copy ${active.label} snippet`} />}
                items={snippets.map((snippet) => ({
                    id: snippet.id,
                    label: snippet.label,
                    content: <HighlightedCode code={snippet.code} lang={snippet.highlight} html={snippet.html} />,
                }))}
            />
        </div>
    );
}
