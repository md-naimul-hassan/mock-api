'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Heading {
    id: string;
    text: string;
    level: number;
}

/** "On this page" navigation built from the h2/h3 headings of the current article. */
export function TableOfContents() {
    const pathname = usePathname();
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [active, setActive] = useState<string>();

    useEffect(() => {
        const elements = Array.from(document.querySelectorAll<HTMLElement>('#main article h2[id], #main article h3[id]'));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- headings are read from the rendered DOM, which only exists after commit
        setHeadings(elements.map((element) => ({ id: element.id, text: element.textContent?.trim() ?? '', level: element.tagName === 'H2' ? 2 : 3 })));
        if (!elements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-80px 0px -70% 0px' },
        );
        elements.forEach((element) => observer.observe(element));
        return () => observer.disconnect();
    }, [pathname]);

    if (!headings.length) return null;
    return (
        <nav aria-label="On this page" className="text-sm">
            <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">On this page</h2>
            <ul className="space-y-1.5 border-l border-border">
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a
                            href={`#${heading.id}`}
                            aria-current={active === heading.id ? 'location' : undefined}
                            className={cn(
                                '-ml-px block border-l py-0.5 transition-colors',
                                heading.level === 3 ? 'pl-6' : 'pl-3',
                                active === heading.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
                            )}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
