import type { Metadata } from 'next';
import { EndpointDirectory } from '@/components/endpoints/endpoint-directory';
import { endpointIndex } from '@/lib/docs';

export const metadata: Metadata = {
    title: 'Endpoint directory',
    description: 'Search every Mock APIs endpoint by path, method, or category: data, simulated CRUD, authentication, testing, and system.',
    alternates: { canonical: '/endpoints' },
};

export default function EndpointsPage() {
    return (
        <main id="main" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <h1 className="text-3xl font-semibold tracking-tight">Endpoint directory</h1>
            <p className="mt-2 text-muted">Every endpoint in one searchable list. Open the docs for details or send a request straight from the playground.</p>
            <div className="mt-8">
                <EndpointDirectory endpoints={endpointIndex} />
            </div>
        </main>
    );
}
