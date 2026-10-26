import Link from 'next/link';
import { API_BASE_URL, SITE_NAME } from '@/lib/site';
import { Logo } from './logo';

const COLUMNS = [
    {
        title: 'Docs',
        links: [
            { href: '/docs/quickstart', label: 'Quickstart' },
            { href: '/docs/authentication', label: 'Authentication' },
            { href: '/docs/query-parameters', label: 'Pagination & queries' },
            { href: '/docs/errors', label: 'Errors' },
        ],
    },
    {
        title: 'Tools',
        links: [
            { href: '/endpoints', label: 'Endpoint directory' },
            { href: '/playground', label: 'Playground' },
            { href: '/docs/http-testing', label: 'HTTP testing' },
            { href: '/docs/openapi', label: 'OpenAPI spec' },
        ],
    },
    {
        title: 'Project',
        links: [
            { href: '/docs/rate-limits', label: 'Fair use & rate limits' },
            { href: '/docs/faq', label: 'FAQ' },
            { href: '/docs/api-reference', label: 'API reference' },
        ],
    },
];

export function SiteFooter() {
    return (
        <footer className="border-t border-border">
            <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
                <div>
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Logo className="size-6" />
                        {SITE_NAME}
                    </Link>
                    <p className="mt-3 max-w-xs text-sm text-muted">
                        Fake data for learning and testing. All records are synthetic; never send real personal data or secrets to a public practice API.
                    </p>
                    <p className="mt-3 font-mono text-xs text-muted">{API_BASE_URL}</p>
                </div>
                {COLUMNS.map((column) => (
                    <nav key={column.title} aria-label={column.title}>
                        <h2 className="text-sm font-semibold">{column.title}</h2>
                        <ul className="mt-3 space-y-2 text-sm">
                            {column.links.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-muted hover:text-fg">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                ))}
            </div>
        </footer>
    );
}
