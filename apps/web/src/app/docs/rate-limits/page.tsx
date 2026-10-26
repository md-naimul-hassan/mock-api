import type { Metadata } from 'next';
import { RATE_LIMIT_DEFAULTS } from '@mockapis/api-spec';
import { CodeBlock } from '@/components/code/code-block';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { DocTable } from '@/components/docs/tables';
import { Callout } from '@/components/ui/callout';

export const metadata: Metadata = {
    title: 'Rate limits & fair use',
    description: 'Mock APIs rate limits, rate-limit headers, and fair-use guidelines.',
    alternates: { canonical: '/docs/rate-limits' },
};

export default function RateLimitsPage() {
    const windowSeconds = RATE_LIMIT_DEFAULTS.windowMs / 1000;
    return (
        <DocsPage
            href="/docs/rate-limits"
            eyebrow="Guides"
            title="Rate limits & fair use"
            lead="Mock APIs is a shared, free service. Rate limits keep it responsive for everyone learning and testing with it."
        >
            <H2 id="limits">Default limits</H2>
            <p>Limits are applied per client IP address over a rolling {windowSeconds}-second window. Operators can configure different values, so always read the headers.</p>
            <DocTable head={['Scope', 'Default limit']} caption="Rate limits">
                <tr>
                    <td className="px-3 py-2 text-sm">
                        All <code className="font-mono text-xs">/api/v1</code> requests
                    </td>
                    <td className="px-3 py-2 text-sm">
                        {RATE_LIMIT_DEFAULTS.max} requests / {windowSeconds} s
                    </td>
                </tr>
                <tr>
                    <td className="px-3 py-2 text-sm">
                        Requests using <code className="font-mono text-xs">?delay</code> or <code className="font-mono text-xs">/test/delay</code>
                    </td>
                    <td className="px-3 py-2 text-sm">
                        {RATE_LIMIT_DEFAULTS.delayMax} requests / {windowSeconds} s (in addition)
                    </td>
                </tr>
                <tr>
                    <td className="px-3 py-2 text-sm">
                        <code className="font-mono text-xs">/health</code>, <code className="font-mono text-xs">/ready</code>, <code className="font-mono text-xs">/openapi.json</code>
                    </td>
                    <td className="px-3 py-2 text-sm">Not rate limited</td>
                </tr>
            </DocTable>

            <H2 id="headers">Rate-limit headers</H2>
            <p>Every API response tells you where you stand:</p>
            <CodeBlock
                lang="bash"
                title="Response headers"
                code={[`RateLimit-Policy: ${RATE_LIMIT_DEFAULTS.max};w=${windowSeconds}`, `RateLimit-Limit: ${RATE_LIMIT_DEFAULTS.max}`, 'RateLimit-Remaining: 97', 'RateLimit-Reset: 42'].join('\n')}
            />
            <p>
                <code>RateLimit-Reset</code> is the number of seconds until the window resets. When you exceed the limit you get <code>429 RATE_LIMIT_EXCEEDED</code> with a{' '}
                <code>Retry-After</code> header. Wait that many seconds before retrying.
            </p>

            <H2 id="fair-use">Fair use</H2>
            <ul>
                <li>Use the API for learning, demos, prototypes, and functional tests.</li>
                <li>Do not run load tests, benchmarks, or scrapers against the public instance. Run your own copy instead (it is open source and ships with Docker files).</li>
                <li>Cache responses in your app where it makes sense; the data is deterministic.</li>
                <li>Never send real personal data, passwords, or secrets. The echo endpoint redacts common secrets, but the safest secret is the one you never send.</li>
            </ul>
            <Callout variant="warning" title="No uptime guarantee">
                <p>
                    The public instance is provided as-is, without guaranteed availability or unlimited capacity, and hosting arrangements may change. For CI pipelines that must
                    be reliable, run Mock APIs locally or in your own infrastructure.
                </p>
            </Callout>
        </DocsPage>
    );
}
