import { tokenizeJson } from '@/lib/json-tokens';
import { cn } from '@/lib/utils';

/** Lightweight JSON syntax highlighting for live responses (no async highlighter needed). */
export function JsonView({ text, className }: { text: string; className?: string }) {
    const tokens = tokenizeJson(text);
    return (
        <pre className={cn('font-mono text-[0.8125rem] leading-[1.6] whitespace-pre', className)}>
            <code>
                {tokens.map((token, index) =>
                    token.type === 'whitespace' || token.type === 'text' ? token.value : (
                        <span key={index} className={`json-${token.type}`}>
                            {token.value}
                        </span>
                    ),
                )}
            </code>
        </pre>
    );
}
