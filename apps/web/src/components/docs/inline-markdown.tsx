import { Fragment } from 'react';

/** Renders the small subset of Markdown used in registry descriptions: `code` and **bold**. */
export function InlineMarkdown({ text }: { text: string }) {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
                if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
                return <Fragment key={index}>{part}</Fragment>;
            })}
        </>
    );
}
