import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RESOURCE_KEYS, resources, type ResourceKey } from '@mockapis/api-spec';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { EndpointCard } from '@/components/docs/endpoint-card';
import { FieldsTable } from '@/components/docs/tables';
import { MethodBadge } from '@/components/ui/badges';
import { Callout } from '@/components/ui/callout';
import { endpointViewsBySection, resourceFields, resourceTotal } from '@/lib/docs';

export const dynamicParams = false;

export function generateStaticParams() {
    return RESOURCE_KEYS.map((resource) => ({ resource }));
}

const isResource = (value: string): value is ResourceKey => (RESOURCE_KEYS as readonly string[]).includes(value);

interface ResourcePageProps {
    params: Promise<{ resource: string }>;
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
    const { resource } = await params;
    if (!isResource(resource)) return {};
    const config = resources[resource];
    return {
        title: `${config.label} API`,
        description: `${config.description} Endpoints, parameters, examples, and code snippets for /${resource}.`,
        alternates: { canonical: `/docs/resources/${resource}` },
    };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
    const { resource } = await params;
    if (!isResource(resource)) notFound();
    const config = resources[resource];
    const endpoints = endpointViewsBySection(resource);
    const total = resourceTotal(resource);

    return (
        <DocsPage
            href={`/docs/resources/${resource}`}
            eyebrow="Resources"
            title={config.label}
            lead={
                <>
                    {config.description} {total !== undefined ? `The dataset contains ${total} ${resource}.` : null}
                </>
            }
        >
            {config.mutable ? (
                <Callout variant="info" title="Writes are simulated">
                    <p>POST, PUT, PATCH, and DELETE validate your input and return realistic responses, but the shared dataset is never modified.</p>
                </Callout>
            ) : (
                <Callout variant="info" title="Read-only resource">
                    <p>
                        {config.label} can be listed, searched, and fetched by ID. Write methods return <code>405 Method Not Allowed</code>.
                    </p>
                </Callout>
            )}

            <H2 id="endpoints">Endpoints</H2>
            <ul className="!list-none !pl-0">
                {endpoints.map((endpoint) => (
                    <li key={endpoint.id}>
                        <a href={`#${endpoint.anchor}`} data-plain className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-surface-2">
                            <MethodBadge method={endpoint.method} />
                            <code className="font-mono text-sm">{endpoint.path.replace('/api/v1', '')}</code>
                            <span className="hidden truncate text-sm text-muted sm:inline">{endpoint.summary}</span>
                        </a>
                    </li>
                ))}
            </ul>

            <H2 id="object">The {config.singular} object</H2>
            <p>
                Use <code>select</code> to return a subset of these fields. Sort with <code>sortBy</code> on <code>{config.sortable.join(', ')}</code>; search matches{' '}
                <code>{config.searchable.join(', ')}</code>. See <Link href="/docs/query-parameters">query parameters</Link>.
            </p>
            <FieldsTable fields={resourceFields(resource)} caption={`${config.singular} fields`} showRequired={false} />

            <div className="mt-12 space-y-12">
                {endpoints.map((endpoint) => (
                    <EndpointCard key={endpoint.id} endpoint={endpoint} />
                ))}
            </div>
        </DocsPage>
    );
}
