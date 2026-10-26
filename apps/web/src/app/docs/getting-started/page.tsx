import type { Metadata } from 'next';
import Link from 'next/link';
import { SIMULATED_HEADER } from '@mockapis/api-spec';
import { CodeBlock } from '@/components/code/code-block';
import { DocsPage, H2, H3 } from '@/components/docs/docs-page';
import { DocTable } from '@/components/docs/tables';
import { Callout } from '@/components/ui/callout';
import { API_ROOT_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Getting started',
    description: 'Conventions shared by every Mock APIs endpoint: URLs, JSON, IDs, headers, simulated writes, and request IDs.',
    alternates: { canonical: '/docs/getting-started' },
};

export default function GettingStartedPage() {
    return (
        <DocsPage
            href="/docs/getting-started"
            eyebrow="Getting started"
            title="Getting started"
            lead="Every endpoint follows the same conventions. Learn them once and the rest of the API is predictable."
        >
            <H2 id="urls">URLs and versioning</H2>
            <p>
                Endpoints are grouped under <code>/api/v1</code>. Resources use plural nouns, records are addressed by numeric ID, and relationships are nested one level deep:
            </p>
            <CodeBlock
                lang="bash"
                title="URL patterns"
                code={[`GET ${API_ROOT_URL}/users`, `GET ${API_ROOT_URL}/users/1`, `GET ${API_ROOT_URL}/users/1/posts`, `GET ${API_ROOT_URL}/posts/search?q=coffee`].join('\n')}
            />
            <p>
                IDs are positive integers. A malformed ID such as <code>/users/abc</code> returns <code>400 INVALID_ID</code>; a well-formed ID that does not exist returns{' '}
                <code>404 RESOURCE_NOT_FOUND</code>.
            </p>

            <H2 id="json">JSON in, JSON out</H2>
            <p>
                Responses are JSON with <code>Content-Type: application/json</code> (except placeholder images, which are SVG). Request bodies must be JSON objects sent with{' '}
                <code>Content-Type: application/json</code>; other content types get <code>415</code>, malformed JSON gets <code>400 INVALID_JSON</code>, and bodies over 100 KB
                get <code>413</code>.
            </p>

            <H2 id="methods">Methods and status codes</H2>
            <DocTable head={['Method', 'Purpose', 'Success']} caption="HTTP methods">
                <tr>
                    <td className="px-3 py-2 font-mono text-xs">GET</td>
                    <td className="px-3 py-2 text-sm">Read lists, single records, searches, and relations</td>
                    <td className="px-3 py-2 text-sm">200</td>
                </tr>
                <tr>
                    <td className="px-3 py-2 font-mono text-xs">POST</td>
                    <td className="px-3 py-2 text-sm">Create a record (simulated)</td>
                    <td className="px-3 py-2 text-sm">201</td>
                </tr>
                <tr>
                    <td className="px-3 py-2 font-mono text-xs">PUT</td>
                    <td className="px-3 py-2 text-sm">Replace a record with a complete body (simulated)</td>
                    <td className="px-3 py-2 text-sm">200</td>
                </tr>
                <tr>
                    <td className="px-3 py-2 font-mono text-xs">PATCH</td>
                    <td className="px-3 py-2 text-sm">Update some fields of a record (simulated)</td>
                    <td className="px-3 py-2 text-sm">200</td>
                </tr>
                <tr>
                    <td className="px-3 py-2 font-mono text-xs">DELETE</td>
                    <td className="px-3 py-2 text-sm">Delete a record (simulated)</td>
                    <td className="px-3 py-2 text-sm">204 (empty body)</td>
                </tr>
            </DocTable>
            <p>
                Using a method a route does not support returns <code>405 METHOD_NOT_ALLOWED</code> with an <code>Allow</code> header listing the supported methods.
            </p>

            <H2 id="simulated-writes">Simulated writes</H2>
            <p>
                Users, products, posts, comments, and todos accept POST, PUT, PATCH, and DELETE. The API validates the body, checks that referenced records exist (for example a
                comment&apos;s <code>postId</code>), detects conflicts such as duplicate emails, and returns what the record <em>would</em> look like. Nothing is stored, so a
                follow-up GET returns the original data. Simulated responses include this header:
            </p>
            <CodeBlock code={`${SIMULATED_HEADER}: true`} lang="bash" title="Response header" />
            <Callout variant="tip" title="Building a CRUD app?">
                <p>Keep created and edited records in your client state (or a local store) and use the API responses as the source of truth for IDs and validation.</p>
            </Callout>
            <p>Carts, recipes, and quotes are read-only.</p>

            <H2 id="headers">Useful response headers</H2>
            <DocTable head={['Header', 'Meaning']} caption="Response headers">
                {[
                    ['X-Request-Id', 'Unique ID for the request. Also included in error bodies. You may send your own (8-64 letters, digits, ".", "_" or "-").'],
                    ['X-Response-Time', 'Server processing time, e.g. 3.2ms.'],
                    [SIMULATED_HEADER, 'Present on simulated writes.'],
                    ['RateLimit-Limit / -Remaining / -Reset', 'Your current rate-limit window. See Rate limits.'],
                    ['Retry-After', 'Seconds to wait, sent with 429 and 503 responses.'],
                ].map(([name, meaning]) => (
                    <tr key={name}>
                        <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{name}</td>
                        <td className="px-3 py-2 text-sm">{meaning}</td>
                    </tr>
                ))}
            </DocTable>

            <H2 id="data">About the data</H2>
            <H3 id="synthetic">Synthetic and deterministic</H3>
            <p>
                Every record is generated from a fixed seed, so the same request returns the same data on every deployment. Names are fictional, emails use{' '}
                <code>example.com</code>, and phone numbers use the reserved <code>555-01xx</code> range. No real person&apos;s data is included.
            </p>
            <H3 id="images">Images</H3>
            <p>
                <code>image</code> and <code>thumbnail</code> fields point to deterministic SVG placeholders served by the API itself, so they never expire and do not depend on
                a third-party image host.
            </p>

            <H2 id="next">Next</H2>
            <p>
                Continue with <Link href="/docs/query-parameters">Pagination &amp; query params</Link> or jump into a resource such as{' '}
                <Link href="/docs/resources/users">Users</Link>.
            </p>
        </DocsPage>
    );
}
