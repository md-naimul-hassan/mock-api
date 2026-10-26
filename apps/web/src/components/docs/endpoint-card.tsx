import { FlaskConical, KeyRound, Link2 } from 'lucide-react';
import type { EndpointView, ResponseExampleView } from '@/lib/docs';
import { highlightCode } from '@/lib/highlight';
import { buildSnippets } from '@/lib/snippets';
import { HighlightedCode } from '../code/highlighted-code';
import { SnippetTabs } from '../code/snippet-tabs';
import { TryIt } from '../request/try-it';
import { MethodBadge, Pill, StatusBadge } from '../ui/badges';
import { CopyButton } from '../ui/copy-button';
import { Tabs } from '../ui/tabs';
import { InlineMarkdown } from './inline-markdown';
import { FieldsTable, ParamsTable } from './tables';

async function ResponseExample({ response }: { response: ResponseExampleView }) {
    const html = response.isJson && response.body ? await highlightCode(response.body, 'json') : undefined;
    return (
        <div>
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                <span className="flex items-center gap-2 text-xs text-muted">
                    <StatusBadge status={response.status} />
                    {response.contentType ?? 'no content'}
                </span>
                {response.body ? <CopyButton value={response.body} label="Copy example response" /> : null}
            </div>
            {response.body ? (
                <HighlightedCode code={response.body} lang="json" html={html} className="max-h-96" />
            ) : (
                <p className="p-4 text-sm text-muted">No response body.</p>
            )}
        </div>
    );
}

export async function EndpointCard({ endpoint, headingLevel = 'h2' }: { endpoint: EndpointView; headingLevel?: 'h2' | 'h3' }) {
    const Heading = headingLevel;
    const snippets = await buildSnippets(endpoint.success.request);
    const headerParams = endpoint.params.filter((param) => param.in === 'header');
    const otherParams = endpoint.params.filter((param) => param.in !== 'header');
    const requestHeaders = [
        ...headerParams,
        ...(endpoint.requestBody
            ? [{ name: 'Content-Type', in: 'header' as const, required: true, type: 'string' as const, description: 'Must be `application/json`.' }]
            : []),
    ];

    const examples = [
        endpoint.success.response && { id: 'success', label: `Success (${endpoint.success.response.status})`, content: <ResponseExample response={endpoint.success.response} /> },
        endpoint.failure?.response && { id: 'failure', label: `Error (${endpoint.failure.response.status})`, content: <ResponseExample response={endpoint.failure.response} /> },
    ].filter((item): item is NonNullable<typeof item> => !!item);

    return (
        <section aria-labelledby={endpoint.anchor} className="border-t border-border pt-8 first:border-t-0 first:pt-0">
            <Heading id={endpoint.anchor} className="group flex scroll-mt-24 items-center gap-2 text-xl font-semibold tracking-tight">
                {endpoint.summary}
                <a href={`#${endpoint.anchor}`} data-plain aria-label={`Link to ${endpoint.summary}`} className="text-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
                    <Link2 aria-hidden className="size-4" />
                </a>
            </Heading>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5">
                    <MethodBadge method={endpoint.method} />
                    <code className="truncate font-mono text-sm">{endpoint.path}</code>
                    <CopyButton value={endpoint.path} label={`Copy path ${endpoint.path}`} />
                </div>
                {endpoint.simulated ? (
                    <Pill>
                        <FlaskConical aria-hidden className="size-3" />
                        Simulated - not persisted
                    </Pill>
                ) : null}
                {endpoint.requiresAuth ? (
                    <Pill>
                        <KeyRound aria-hidden className="size-3" />
                        Demo bearer token
                    </Pill>
                ) : null}
            </div>

            <p className="mt-4 leading-7">
                <InlineMarkdown text={endpoint.description} />
            </p>

            {otherParams.length ? (
                <>
                    <h4 className="mt-6 text-sm font-semibold">Parameters</h4>
                    <ParamsTable params={otherParams} caption={`Parameters for ${endpoint.summary}`} />
                </>
            ) : null}

            {requestHeaders.length ? (
                <>
                    <h4 className="mt-6 text-sm font-semibold">Headers</h4>
                    <ParamsTable params={requestHeaders} caption={`Headers for ${endpoint.summary}`} />
                </>
            ) : null}

            {endpoint.requestBody ? (
                <>
                    <h4 className="mt-6 text-sm font-semibold">Request body</h4>
                    <p className="mt-1 text-sm text-muted">{endpoint.requestBody.description}</p>
                    {endpoint.requestBody.fields.length ? <FieldsTable fields={endpoint.requestBody.fields} caption={`Body fields for ${endpoint.summary}`} /> : null}
                </>
            ) : null}

            <h4 className="mt-6 text-sm font-semibold">Status codes</h4>
            <ul className="mt-2 space-y-1.5 text-sm">
                {endpoint.responses.map((response) => (
                    <li key={response.status} className="flex items-start gap-2">
                        <StatusBadge status={response.status} className="mt-0.5" />
                        <span>
                            <InlineMarkdown text={response.description} />
                        </span>
                    </li>
                ))}
            </ul>

            <h4 className="mt-6 mb-2 text-sm font-semibold">Request</h4>
            <SnippetTabs snippets={snippets} title={`Code samples for ${endpoint.summary}`} />

            {examples.length ? (
                <>
                    <h4 className="mt-6 mb-2 text-sm font-semibold">Example responses</h4>
                    <p className="mb-2 text-xs text-muted">Captured from the real API with the requests shown on this page.</p>
                    <div className="overflow-hidden rounded-lg border border-border bg-code">
                        <Tabs label={`Example responses for ${endpoint.summary}`} listClassName="px-2" items={examples} />
                    </div>
                </>
            ) : null}

            <h4 className="mt-6 mb-2 text-sm font-semibold">Try it</h4>
            <TryIt endpointId={endpoint.id} success={endpoint.success.request} failure={endpoint.failure ? { request: endpoint.failure.request, status: endpoint.failure.status } : undefined} />
        </section>
    );
}
