import type { Metadata } from 'next';
import Link from 'next/link';
import { resourceList } from '@mockapis/api-spec';
import { CodeBlock } from '@/components/code/code-block';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { DocTable } from '@/components/docs/tables';
import { Callout } from '@/components/ui/callout';
import { resourceTotal } from '@/lib/docs';
import { API_BASE_URL, API_ROOT_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Introduction',
    description: 'What Mock APIs is, what it is for, and how its free fake REST API is organized.',
    alternates: { canonical: '/docs' },
};

export default function IntroductionPage() {
    return (
        <DocsPage
            href="/docs"
            eyebrow="Getting started"
            title="Introduction"
            lead="Mock APIs is a free public REST API that serves realistic, synthetic data. Use it to learn HTTP, build front-end prototypes, write tutorials, and test API clients without running your own backend."
        >
            <H2 id="base-url">Base URL</H2>
            <p>All endpoints live under a single versioned prefix. No API key or signup is required, and CORS is enabled for every origin.</p>
            <CodeBlock code={API_ROOT_URL} lang="bash" title="Base URL" />

            <H2 id="what-you-get">What you get</H2>
            <ul>
                <li>
                    <strong>Eight related resources</strong> with deterministic seed data: users, products, posts, comments, todos, carts, recipes, and quotes.
                </li>
                <li>
                    <strong>Real query features</strong>: pagination with totals, sorting, field selection, search, and filters. See{' '}
                    <Link href="/docs/query-parameters">Pagination &amp; query params</Link>.
                </li>
                <li>
                    <strong>Simulated CRUD</strong>: POST, PUT, PATCH, and DELETE validate input and return realistic responses, but never modify the shared data.
                </li>
                <li>
                    <strong>Demo authentication</strong> with login, register, refresh, and protected routes that return real 401 and 403 errors. See{' '}
                    <Link href="/docs/authentication">Authentication</Link>.
                </li>
                <li>
                    <strong>HTTP testing utilities</strong> to echo requests, delay responses, and return any common status code. See{' '}
                    <Link href="/docs/http-testing">HTTP testing utilities</Link>.
                </li>
                <li>
                    <strong>Consistent errors</strong> with a machine-readable code and request ID. See <Link href="/docs/errors">Errors</Link>.
                </li>
                <li>
                    <strong>An OpenAPI 3 document</strong> at <code>{API_BASE_URL}/openapi.json</code>, generated from the same source as the API. See{' '}
                    <Link href="/docs/openapi">OpenAPI spec</Link>.
                </li>
            </ul>

            <H2 id="resources">Resources</H2>
            <DocTable head={['Resource', 'Records', 'Writes', 'Description']} caption="Available resources">
                {resourceList.map((resource) => (
                    <tr key={resource.key}>
                        <td className="px-3 py-2">
                            <Link href={`/docs/resources/${resource.key}`} className="font-mono text-sm text-accent hover:underline">
                                /{resource.key}
                            </Link>
                        </td>
                        <td className="px-3 py-2 text-sm">{resourceTotal(resource.key) ?? '-'}</td>
                        <td className="px-3 py-2 text-sm">{resource.mutable ? 'Simulated' : 'Read-only'}</td>
                        <td className="px-3 py-2 text-sm text-muted">{resource.description}</td>
                    </tr>
                ))}
            </DocTable>

            <H2 id="good-uses">Good uses (and bad ones)</H2>
            <p>Mock APIs is built for learning and testing:</p>
            <ul>
                <li>Practicing fetch, Axios, Dio, or requests in a course or bootcamp.</li>
                <li>Prototyping lists, detail pages, search, infinite scroll, and forms.</li>
                <li>Testing loading, empty, error, and slow-network states in your UI.</li>
                <li>Demonstrating API concepts in blog posts and videos.</li>
            </ul>
            <Callout variant="warning" title="Not for production">
                <p>
                    Do not use Mock APIs as the backend of a real product, for load testing, or to store real personal data. The demo authentication is intentionally simple
                    and must never protect a real application. There is no uptime guarantee and requests are <Link href="/docs/rate-limits">rate limited</Link>.
                </p>
            </Callout>

            <H2 id="next-steps">Next steps</H2>
            <p>
                Send your first request in the <Link href="/docs/quickstart">Quickstart</Link>, read <Link href="/docs/getting-started">Getting started</Link> for the conventions
                every endpoint follows, or experiment in the <Link href="/playground">Playground</Link>.
            </p>
        </DocsPage>
    );
}
