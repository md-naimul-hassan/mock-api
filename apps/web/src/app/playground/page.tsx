import type { Metadata } from 'next';
import { Playground, type PlaygroundPreset } from '@/components/playground/playground';
import { Callout } from '@/components/ui/callout';
import { endpointViews, getEndpointView } from '@/lib/docs';
import type { RequestSpec } from '@/lib/request';
import { API_ROOT_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'API playground',
    description: 'Send real requests to Mock APIs from your browser, inspect responses, and generate code in six languages.',
    alternates: { canonical: '/playground' },
};

const presets: PlaygroundPreset[] = endpointViews.map((endpoint) => ({
    id: endpoint.id,
    label: `${endpoint.method} ${endpoint.path.replace('/api/v1', '') || '/'} - ${endpoint.summary}`,
    group: endpoint.sectionLabel,
    request: endpoint.success.request,
}));

const DEFAULT_REQUEST: RequestSpec = { method: 'GET', url: `${API_ROOT_URL}/users?limit=5`, headers: [] };

interface PlaygroundPageProps {
    searchParams: Promise<{ endpoint?: string | string[]; example?: string | string[] }>;
}

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
    const params = await searchParams;
    const endpointId = typeof params.endpoint === 'string' ? params.endpoint : undefined;
    const endpoint = endpointId ? getEndpointView(endpointId) : undefined;
    const wantsFailure = params.example === 'failure';
    const initial = endpoint ? (wantsFailure && endpoint.failure ? endpoint.failure.request : endpoint.success.request) : DEFAULT_REQUEST;

    return (
        <main id="main" className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
            <h1 className="text-3xl font-semibold tracking-tight">API playground</h1>
            <p className="mt-2 max-w-3xl text-muted">
                Build a request, send it to the live API, and inspect the real response. Pick an example to start, or type any URL. Every request counts toward your rate limit.
            </p>
            <Callout variant="info" className="max-w-3xl">
                <p>Requests go directly from your browser to the API. Do not paste real passwords, personal data, or production tokens here.</p>
            </Callout>
            <div className="mt-6">
                <Playground key={`${endpoint?.id ?? 'default'}-${wantsFailure}`} presets={presets} initial={initial} initialPresetId={endpoint?.id} />
            </div>
        </main>
    );
}
