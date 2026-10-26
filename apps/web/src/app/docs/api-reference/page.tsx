import type { Metadata } from 'next';
import Link from 'next/link';
import { SECTION_LABELS, type DocSection } from '@mockapis/api-spec';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { EndpointCard } from '@/components/docs/endpoint-card';
import { MethodBadge, Pill } from '@/components/ui/badges';
import { endpointViews, endpointViewsBySection } from '@/lib/docs';
import { API_BASE_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'API reference',
    description: 'Every Mock APIs endpoint at a glance, plus system endpoints for health, readiness, and the OpenAPI document.',
    alternates: { canonical: '/docs/api-reference' },
};

export default function ApiReferencePage() {
    const sections = [...new Set(endpointViews.map((endpoint) => endpoint.section))].filter((section) => section !== 'system') as DocSection[];
    const system = endpointViewsBySection('system');

    return (
        <DocsPage
            href="/docs/api-reference"
            eyebrow="Reference"
            title="API reference"
            lead={
                <>
                    All {endpointViews.length} endpoints, grouped by resource. Paths are relative to <code className="font-mono text-base">{API_BASE_URL}</code>. Select an
                    endpoint for parameters, examples, and a live &quot;Try it&quot; panel.
                </>
            }
        >
            {sections.map((section) => (
                <section key={section} aria-labelledby={`ref-${section}`}>
                    <H2 id={`ref-${section}`}>{SECTION_LABELS[section]}</H2>
                    <ul className="!list-none !pl-0">
                        {endpointViewsBySection(section).map((endpoint) => (
                            <li key={endpoint.id}>
                                <Link href={endpoint.href} data-plain className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-1.5 hover:bg-surface-2">
                                    <MethodBadge method={endpoint.method} />
                                    <code className="font-mono text-sm">{endpoint.path}</code>
                                    <span className="text-sm text-muted">{endpoint.summary}</span>
                                    {endpoint.simulated ? <Pill>simulated</Pill> : null}
                                    {endpoint.requiresAuth ? <Pill>auth</Pill> : null}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}

            <H2 id="system">System endpoints</H2>
            <p>Operational endpoints live outside the versioned prefix and are not rate limited.</p>
            <div className="mt-8 space-y-12">
                {system.map((endpoint) => (
                    <EndpointCard key={endpoint.id} endpoint={endpoint} headingLevel="h3" />
                ))}
            </div>
        </DocsPage>
    );
}
