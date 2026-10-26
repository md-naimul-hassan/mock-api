import type { Metadata } from 'next';
import Link from 'next/link';
import { DEMO_CREDENTIALS } from '@mockapis/api-spec';
import { DocsPage, H2, H3 } from '@/components/docs/docs-page';
import { EndpointCard } from '@/components/docs/endpoint-card';
import { DocTable } from '@/components/docs/tables';
import { Callout } from '@/components/ui/callout';
import { endpointViewsBySection } from '@/lib/docs';

export const metadata: Metadata = {
    title: 'Authentication',
    description: 'Practice login, registration, bearer tokens, refresh tokens, and role-based access with Mock APIs demo authentication.',
    alternates: { canonical: '/docs/authentication' },
};

const ERRORS = [
    ['401', 'MISSING_TOKEN', 'No Authorization header was sent.'],
    ['401', 'INVALID_AUTH_HEADER', 'The header is not in the form "Bearer <token>".'],
    ['401', 'INVALID_TOKEN', 'The token is malformed, tampered with, signed by someone else, or the wrong type (e.g. a refresh token sent as an access token).'],
    ['401', 'TOKEN_EXPIRED', 'The token was valid but has expired. Refresh it or log in again.'],
    ['401', 'INVALID_CREDENTIALS', 'Wrong username/email or password on login.'],
    ['403', 'FORBIDDEN', 'The token is valid but the user lacks the required role.'],
];

export default function AuthenticationPage() {
    const endpoints = endpointViewsBySection('auth');
    return (
        <DocsPage
            href="/docs/authentication"
            eyebrow="Guides"
            title="Authentication"
            lead="Demo authentication lets you practice login forms, token storage, protected routes, token refresh, and role checks against real HTTP behavior."
        >
            <Callout variant="warning" title="For practice only">
                <p>
                    These flows are deliberately simple and use publicly documented demo accounts. Tokens are signed demo JWTs that only work with Mock APIs. Never use this
                    API, these credentials, or these patterns to secure a real application, and never send real passwords to it.
                </p>
            </Callout>

            <H2 id="demo-accounts">Demo accounts</H2>
            <DocTable head={['Role', 'Username', 'Password', 'Use it to']} caption="Demo credentials">
                <tr>
                    <td className="px-3 py-2 text-sm">admin</td>
                    <td className="px-3 py-2 font-mono text-xs">{DEMO_CREDENTIALS.admin.username}</td>
                    <td className="px-3 py-2 font-mono text-xs">{DEMO_CREDENTIALS.admin.password}</td>
                    <td className="px-3 py-2 text-sm">Access every demo route, including /auth/admin</td>
                </tr>
                <tr>
                    <td className="px-3 py-2 text-sm">user</td>
                    <td className="px-3 py-2 font-mono text-xs">{DEMO_CREDENTIALS.user.username}</td>
                    <td className="px-3 py-2 font-mono text-xs">{DEMO_CREDENTIALS.user.password}</td>
                    <td className="px-3 py-2 text-sm">See a 403 Forbidden on /auth/admin</td>
                </tr>
            </DocTable>
            <p>
                Every seeded user can log in with the password <code>&lt;username&gt;pass</code>. You can log in with <code>username</code> or <code>email</code>.
            </p>

            <H2 id="flow">The token flow</H2>
            <ol>
                <li>
                    <code>POST /auth/login</code> with credentials. You receive an <code>accessToken</code> (default 30 minutes; set <code>expiresInMins</code> between 1 and
                    1440) and a <code>refreshToken</code> (7 days).
                </li>
                <li>
                    Send the access token on protected requests: <code>Authorization: Bearer &lt;accessToken&gt;</code>.
                </li>
                <li>
                    When it expires you get <code>401 TOKEN_EXPIRED</code>. Call <code>POST /auth/refresh</code> with the refresh token to get a new pair.
                </li>
            </ol>
            <Callout variant="tip" title="Practice expiry handling">
                <p>
                    Log in with <code>&quot;expiresInMins&quot;: 1</code> to get a token that expires after a minute, then exercise your refresh logic.
                </p>
            </Callout>

            <H3 id="register">Registration</H3>
            <p>
                <code>POST /auth/register</code> validates the new account (including username and email conflicts with seeded users) and returns tokens for a simulated user.
                The account is not stored, but its access token works with <code>/auth/me</code> until it expires, so a sign-up form can complete its full flow.
            </p>

            <H2 id="errors">Authentication errors</H2>
            <p>
                Failures use the standard <Link href="/docs/errors">error format</Link>. 401 responses include a <code>WWW-Authenticate: Bearer</code> header.
            </p>
            <DocTable head={['Status', 'Code', 'When']} caption="Authentication errors">
                {ERRORS.map(([status, code, when]) => (
                    <tr key={code}>
                        <td className="px-3 py-2 font-mono text-xs">{status}</td>
                        <td className="px-3 py-2 font-mono text-xs">{code}</td>
                        <td className="px-3 py-2 text-sm">{when}</td>
                    </tr>
                ))}
            </DocTable>

            <H2 id="storage">Where to keep tokens in your app</H2>
            <p>
                For learning purposes, keeping the access token in memory and the refresh token in <code>sessionStorage</code> is fine. Real applications should follow their
                platform&apos;s security guidance (for example HTTP-only cookies set by your own backend, or the platform keychain on mobile).
            </p>

            <div className="mt-12 space-y-12">
                {endpoints.map((endpoint) => (
                    <EndpointCard key={endpoint.id} endpoint={endpoint} />
                ))}
            </div>
        </DocsPage>
    );
}
