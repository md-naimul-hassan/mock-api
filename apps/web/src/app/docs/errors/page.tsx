import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeBlock } from '@/components/code/code-block';
import { DocsPage, H2 } from '@/components/docs/docs-page';
import { DocTable } from '@/components/docs/tables';
import { getEndpointView } from '@/lib/docs';

export const metadata: Metadata = {
    title: 'Errors',
    description: 'The Mock APIs error format, HTTP status codes, and machine-readable error codes.',
    alternates: { canonical: '/docs/errors' },
};

const CODES: [number, string, string][] = [
    [400, 'INVALID_PARAMETER', 'A query or path parameter is missing, unknown, or out of range.'],
    [400, 'INVALID_ID', 'A path ID is not a positive integer.'],
    [400, 'INVALID_JSON', 'The request body is not valid JSON.'],
    [401, 'MISSING_TOKEN / INVALID_AUTH_HEADER', 'Authorization header missing or malformed.'],
    [401, 'INVALID_TOKEN / TOKEN_EXPIRED', 'Bearer token invalid or expired.'],
    [401, 'INVALID_CREDENTIALS', 'Login failed.'],
    [403, 'FORBIDDEN', 'Authenticated, but not allowed.'],
    [404, 'RESOURCE_NOT_FOUND', 'No record with that ID (or category).'],
    [404, 'ROUTE_NOT_FOUND', 'No endpoint at that path.'],
    [405, 'METHOD_NOT_ALLOWED', 'The path exists but not for this method. See the Allow header.'],
    [409, 'CONFLICT', 'A unique value (email, username) is already taken.'],
    [413, 'PAYLOAD_TOO_LARGE', 'The body exceeds 100 KB.'],
    [415, 'UNSUPPORTED_MEDIA_TYPE', 'The body is not sent as application/json.'],
    [422, 'VALIDATION_ERROR', 'The JSON body is well-formed but fails validation. See the errors array.'],
    [429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Wait for Retry-After seconds.'],
    [500, 'INTERNAL_ERROR', 'Unexpected server error. No internal details are exposed.'],
    [503, 'SERVICE_UNAVAILABLE / REQUEST_TIMEOUT', 'The database is unavailable or the request took too long. Retry later.'],
];

export default function ErrorsPage() {
    const notFound = getEndpointView('users.get')!.failure?.response?.body ?? '';
    const validation = getEndpointView('users.create')!.failure?.response?.body ?? '';

    return (
        <DocsPage
            href="/docs/errors"
            eyebrow="Guides"
            title="Errors"
            lead="Every error uses the same JSON shape and an accurate HTTP status code, so you can write one error handler for the whole API."
        >
            <H2 id="format">Error format</H2>
            <CodeBlock code={notFound} lang="json" title="404 Not Found" />
            <DocTable head={['Field', 'Description']} caption="Error fields">
                {[
                    ['message', 'Human-readable explanation. Safe to show to developers; do not parse it.'],
                    ['status', 'The HTTP status code, repeated for convenience.'],
                    ['code', 'Stable machine-readable error code. Branch on this.'],
                    ['path', 'The request path (without query string).'],
                    ['requestId', 'Matches the X-Request-Id response header. Include it in bug reports.'],
                    ['errors', 'Only for validation and conflict errors: a list of { path, message } per field.'],
                ].map(([field, description]) => (
                    <tr key={field}>
                        <td className="px-3 py-2 font-mono text-xs">{field}</td>
                        <td className="px-3 py-2 text-sm">{description}</td>
                    </tr>
                ))}
            </DocTable>

            <H2 id="validation">Validation errors</H2>
            <p>
                <code>422</code> responses list every problem at once, keyed by field path, which maps neatly onto form field errors:
            </p>
            <CodeBlock code={validation} lang="json" title="422 Unprocessable Entity" />

            <H2 id="codes">Status and error codes</H2>
            <DocTable head={['Status', 'Code', 'Meaning']} caption="Error codes">
                {CODES.map(([status, code, meaning]) => (
                    <tr key={code}>
                        <td className="px-3 py-2 font-mono text-xs">{status}</td>
                        <td className="px-3 py-2 font-mono text-xs">{code}</td>
                        <td className="px-3 py-2 text-sm">{meaning}</td>
                    </tr>
                ))}
            </DocTable>

            <H2 id="handling">Handling errors in your client</H2>
            <ul>
                <li>
                    Check the HTTP status first. <code>fetch</code> does not throw on 4xx/5xx; Axios and Dio do.
                </li>
                <li>
                    Branch on <code>code</code>, not on <code>message</code>.
                </li>
                <li>
                    Retry only <code>429</code> and <code>503</code>, after the <code>Retry-After</code> delay.
                </li>
                <li>
                    Want to test your error UI? <Link href="/docs/http-testing">/test/status/:code</Link> returns any common status on demand.
                </li>
            </ul>
        </DocsPage>
    );
}
