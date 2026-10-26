import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ALL_DOC_PAGES } from '@/lib/nav';

function Pager({ href }: { href: string }) {
    const index = ALL_DOC_PAGES.findIndex((page) => page.href === href);
    const previous = index > 0 ? ALL_DOC_PAGES[index - 1] : undefined;
    const next = index >= 0 && index < ALL_DOC_PAGES.length - 1 ? ALL_DOC_PAGES[index + 1] : undefined;
    return (
        <nav aria-label="Previous and next pages" className="mt-16 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            {previous ? (
                <Link href={previous.href} className="group rounded-lg border border-border p-4 hover:border-accent">
                    <span className="flex items-center gap-1 text-xs text-muted">
                        <ChevronLeft aria-hidden className="size-3.5" /> Previous
                    </span>
                    <span className="mt-1 block font-medium group-hover:text-accent">{previous.title}</span>
                </Link>
            ) : (
                <span />
            )}
            {next ? (
                <Link href={next.href} className="group rounded-lg border border-border p-4 text-right hover:border-accent">
                    <span className="flex items-center justify-end gap-1 text-xs text-muted">
                        Next <ChevronRight aria-hidden className="size-3.5" />
                    </span>
                    <span className="mt-1 block font-medium group-hover:text-accent">{next.title}</span>
                </Link>
            ) : null}
        </nav>
    );
}

interface DocsPageProps {
    href: string;
    eyebrow?: string;
    title: string;
    lead: ReactNode;
    children: ReactNode;
}

/** Standard frame for documentation articles: title, lead paragraph, content, and pager. */
export function DocsPage({ href, eyebrow, title, lead, children }: DocsPageProps) {
    return (
        <article className="min-w-0">
            {eyebrow ? <p className="text-sm font-medium text-accent">{eyebrow}</p> : null}
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <div className="mt-4 text-lg leading-8 text-muted">{lead}</div>
            <div className="prose-docs mt-8">{children}</div>
            <Pager href={href} />
        </article>
    );
}

export function H2({ id, children }: { id: string; children: ReactNode }) {
    return (
        <h2 id={id} className="scroll-mt-24">
            {children}
        </h2>
    );
}

export function H3({ id, children }: { id: string; children: ReactNode }) {
    return (
        <h3 id={id} className="scroll-mt-24">
            {children}
        </h3>
    );
}
