import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { Callout } from '@/components/ui/callout';
import { API_ROOT_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'API Builder',
    description: 'Create custom mock APIs with your own endpoints, status codes, and JSON responses.',
    alternates: { canonical: '/docs/api-builder' },
};

export default function ApiBuilderDocsPage() {
    return (
        <DocsPage
            href="/docs/api-builder"
            title="API Builder"
            lead="Design your own mock APIs for frontend development: custom paths, status codes, JSON bodies, and shareable public URLs."
        >
            <p>
                The <Link href="/builder">API Builder</Link> stores projects you own in the database and serves them at stable URLs under{' '}
                <code>/api/v1/mock-apis/:projectId</code>, where <code>projectId</code> is the MongoDB <code>_id</code>. Management requires a
                builder account; calling the generated URLs does not.
            </p>

            <H2 id="quick-start">Quick start</H2>
            <ol>
                <li>
                    Open <Link href="/builder">API Builder</Link> and create an account (separate from the demo auth users in the practice API).
                </li>
                <li>Create a mock API project, then add endpoints with method, path, status code, and JSON body.</li>
                <li>
                    Copy the generated URL, for example <code>{API_ROOT_URL}/mock-apis/&lt;_id&gt;/api/users</code>, into your frontend app.
                </li>
            </ol>

            <Callout variant="tip" title="Management vs runtime">
                Creating and editing projects requires your builder bearer token. Calling the generated <code>/api/v1/mock-apis/...</code> URLs is public by
                design so frontends can integrate without credentials.
            </Callout>

            <H2 id="management-api">Management API</H2>
            <p>
                Programmatic access lives under <code>{API_ROOT_URL}/builder</code>:
            </p>
            <ul>
                <li>
                    <code>POST /api/v1/builder/auth/register</code> and <code>POST /api/v1/builder/auth/login</code>
                </li>
                <li>
                    <code>GET/POST /api/v1/builder/projects</code>
                </li>
                <li>
                    <code>GET/PATCH/DELETE /api/v1/builder/projects/:id</code>
                </li>
                <li>
                    <code>POST /api/v1/builder/projects/:id/endpoints</code>
                </li>
                <li>
                    <code>PATCH/DELETE /api/v1/builder/projects/:id/endpoints/:endpointId</code>
                </li>
            </ul>

            <H2 id="limits">Limits</H2>
            <p>Projects and endpoints are quota-limited (projects per account, endpoints per project, response body size, and max delay) to reduce abuse.</p>
        </DocsPage>
    );
}
