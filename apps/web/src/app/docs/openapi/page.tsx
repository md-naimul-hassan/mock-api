import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { API_VERSION } from '@mockapis/api-spec';
import { CodeBlock } from '@/components/code/code-block';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { buttonClasses } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { API_BASE_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'OpenAPI spec',
    description: 'Download the Mock APIs OpenAPI 3 document and import it into Postman, Insomnia, Swagger UI, or a code generator.',
    alternates: { canonical: '/docs/openapi' },
};

export default function OpenApiPage() {
    const specUrl = `${API_BASE_URL}/openapi.json`;
    return (
        <DocsPage
            href="/docs/openapi"
            eyebrow="Reference"
            title="OpenAPI spec"
            lead="A machine-readable OpenAPI 3.0 description of every endpoint, schema, parameter, and example response."
        >
            <div className="mt-2 flex flex-wrap gap-3">
                <a href={specUrl} target="_blank" rel="noreferrer" className={buttonClasses()}>
                    <ExternalLink aria-hidden className="size-4" /> Open openapi.json
                </a>
                <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer" className={buttonClasses({ variant: 'outline' })}>
                    <ExternalLink aria-hidden className="size-4" /> Swagger UI
                </a>
            </div>

            <H2 id="url">Spec URL</H2>
            <CodeBlock code={specUrl} lang="bash" title="OpenAPI 3.0 (JSON)" />
            <p>
                The document describes API version <code>{API_VERSION}</code> and uses the API&apos;s public base URL as its server, so generated clients point at the right
                host.
            </p>

            <H2 id="single-source">Always in sync</H2>
            <p>
                The API, this website, and the OpenAPI document are all generated from one shared package that defines the schemas and the endpoint registry. The example
                responses embedded in the spec and shown on these pages are captured by running the documented requests against the real API, and the test suite fails if
                they drift.
            </p>

            <H2 id="import">Importing</H2>
            <ul>
                <li>
                    <strong>Postman</strong>: Import → Link → paste the spec URL. Postman creates a collection with every endpoint.
                </li>
                <li>
                    <strong>Insomnia</strong>: Create → Import → URL.
                </li>
                <li>
                    <strong>Code generators</strong>: point <code>openapi-generator</code>, <code>openapi-typescript</code>, or similar tools at the spec URL.
                </li>
            </ul>
            <CodeBlock code={`npx openapi-typescript ${specUrl} -o mock-apis.d.ts`} lang="bash" title="Generate TypeScript types" />

            <H2 id="auth">Authentication in the spec</H2>
            <p>
                Protected routes declare a <code>demoBearer</code> HTTP bearer security scheme. Get a token from <Link href="/docs/authentication">demo login</Link> and paste it
                into your tool&apos;s bearer token field.
            </p>
            <Callout variant="info">
                <p>
                    The spec is served with permissive CORS, so browser-based tools can load it directly. It is cached for five minutes.
                </p>
            </Callout>
        </DocsPage>
    );
}
