'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { SITE_NAME } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { ThemeToggle } from './theme';

const LINKS = [
    { href: '/docs', label: 'Docs', match: (path: string) => path.startsWith('/docs') && !path.startsWith('/docs/api-reference') },
    { href: '/endpoints', label: 'Endpoints', match: (path: string) => path.startsWith('/endpoints') },
    { href: '/playground', label: 'Playground', match: (path: string) => path.startsWith('/playground') },
    { href: '/docs/api-reference', label: 'API reference', match: (path: string) => path.startsWith('/docs/api-reference') },
];

export function SiteHeader() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [lastPath, setLastPath] = useState(pathname);

    if (pathname !== lastPath) {
        setLastPath(pathname);
        setOpen(false);
    }

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
                Skip to content
            </a>
            <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-6 px-4 sm:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
                    <Logo className="size-7" />
                    {SITE_NAME}
                </Link>
                <nav aria-label="Main" className="hidden md:block">
                    <ul className="flex items-center gap-1 text-sm">
                        {LINKS.map((link) => {
                            const active = link.match(pathname);
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn('rounded-md px-3 py-1.5 transition-colors', active ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <div className="ml-auto flex items-center gap-1">
                    <ThemeToggle />
                    <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-fg md:hidden"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                        aria-controls="mobile-menu"
                        onClick={() => setOpen((value) => !value)}
                    >
                        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
                    </button>
                </div>
            </div>
            {open ? (
                <nav id="mobile-menu" aria-label="Main" className="border-t border-border px-4 py-3 md:hidden">
                    <ul className="space-y-1">
                        {LINKS.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href} className="block rounded-md px-3 py-2 text-sm hover:bg-surface-2" aria-current={link.match(pathname) ? 'page' : undefined}>
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            ) : null}
        </header>
    );
}
