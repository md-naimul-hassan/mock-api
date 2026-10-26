import type { Metadata } from 'next';
import Link from 'next/link';
import { SnippetTabs } from '@/components/code/snippet-tabs';
import { CodeBlock } from '@/components/code/code-block';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { Callout } from '@/components/ui/callout';
import { getEndpointView } from '@/lib/docs';
import { highlightCode } from '@/lib/highlight';
import { API_ROOT_URL } from '@/lib/site';
import { buildSnippets } from '@/lib/snippets';

export const metadata: Metadata = {
    title: 'Quickstart',
    description: 'Send your first Mock APIs request in under a minute with cURL, JavaScript, Dart, or Python.',
    alternates: { canonical: '/docs/quickstart' },
};

export default async function QuickstartPage() {
    const list = getEndpointView('products.list')!;
    const create = getEndpointView('posts.create')!;
    const login = getEndpointView('auth.login')!;
    const [listSnippets, createSnippets, loginSnippets] = await Promise.all([buildSnippets(list.success.request), buildSnippets(create.success.request), buildSnippets(login.success.request)]);
    const listResponse = list.success.response?.body ?? '';

    return (
        <DocsPage
            href="/docs/quickstart"
            eyebrow="Getting started"
            title="Quickstart"
            lead="Three requests that cover most of what you will do with Mock APIs: read a list, create a record, and log in."
        >
            <H2 id="read-a-list">1. Read a list</H2>
            <p>
                List endpoints return an array named after the resource plus pagination metadata. Ask for two products with <code>limit=2</code>:
            </p>
            <SnippetTabs snippets={listSnippets} />
            <p>The response looks like this (trimmed to two records):</p>
            <div className="my-4 overflow-hidden rounded-lg border border-border bg-code">
                <div className="max-h-96 overflow-auto p-4" dangerouslySetInnerHTML={{ __html: await highlightCode(listResponse, 'json') }} />
            </div>

            <H2 id="create-a-record">2. Create a record</H2>
            <p>
                Send JSON with a <code>Content-Type: application/json</code> header. The API validates the body and answers <code>201 Created</code> with the new record and the
                next available ID. Writes are <strong>simulated</strong>: the response is realistic, but the shared dataset does not change.
            </p>
            <SnippetTabs snippets={createSnippets} />

            <H2 id="log-in">3. Log in with a demo account</H2>
            <p>
                Exchange the public demo credentials for an access token, then send it as <code>Authorization: Bearer &lt;token&gt;</code> to protected endpoints such as{' '}
                <code>/auth/me</code>.
            </p>
            <SnippetTabs snippets={loginSnippets} />
            <CodeBlock code={`curl '${API_ROOT_URL}/auth/me' \\\n  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'`} lang="bash" title="Use the token" />
            <Callout variant="warning">
                <p>Demo authentication is for practice only. Never reuse these patterns or credentials to secure a real application.</p>
            </Callout>

            <H2 id="what-next">What next?</H2>
            <ul>
                <li>
                    Learn the shared conventions in <Link href="/docs/getting-started">Getting started</Link>.
                </li>
                <li>
                    Explore filters and sorting in <Link href="/docs/query-parameters">Pagination &amp; query params</Link>.
                </li>
                <li>
                    Try any endpoint interactively in the <Link href="/playground">Playground</Link>.
                </li>
            </ul>
        </DocsPage>
    );
}
