import type { Metadata } from 'next';
import { ALLOWED_TEST_STATUS_CODES, MAX_DELAY_MS } from '@mockapis/api-spec';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { EndpointCard } from '@/components/docs/endpoint-card';
import { Callout } from '@/components/ui/callout';
import { endpointViewsBySection } from '@/lib/docs';

export const metadata: Metadata = {
    title: 'HTTP testing utilities',
    description: 'Echo requests, delay responses, and return any common HTTP status code to test your client.',
    alternates: { canonical: '/docs/http-testing' },
};

export default function HttpTestingPage() {
    const endpoints = endpointViewsBySection('testing');
    return (
        <DocsPage
            href="/docs/http-testing"
            eyebrow="Guides"
            title="HTTP testing utilities"
            lead="Inspect exactly what your client sends, simulate slow networks, and trigger specific status codes so every loading and error state in your app gets exercised."
        >
            <H2 id="overview">Overview</H2>
            <ul>
                <li>
                    <code>POST /test/echo</code> returns the method, path, query, headers, and JSON body it received. Useful for debugging serializers and interceptors.
                </li>
                <li>
                    <code>GET /test/delay?ms=</code> waits up to {MAX_DELAY_MS} ms before responding. Use it to test spinners, skeletons, and client timeouts.
                </li>
                <li>
                    <code>GET /test/status/:code</code> responds with one of: {ALLOWED_TEST_STATUS_CODES.join(', ')}.
                </li>
            </ul>
            <Callout variant="info" title="Secrets are never echoed">
                <p>
                    The echo endpoint replaces <code>Authorization</code>, <code>Cookie</code>, API-key headers, and body fields such as <code>password</code> or{' '}
                    <code>token</code> with <code>[redacted]</code>, and lists what it redacted. Still, never send real secrets to a public API.
                </p>
            </Callout>

            <div className="mt-12 space-y-12">
                {endpoints.map((endpoint) => (
                    <EndpointCard key={endpoint.id} endpoint={endpoint} />
                ))}
            </div>
        </DocsPage>
    );
}
