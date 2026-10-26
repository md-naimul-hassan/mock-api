import Link from 'next/link';
import {
    ArrowRight,
    BookOpen,
    CheckSquare,
    ChefHat,
    Clock,
    FileText,
    FlaskConical,
    Gauge,
    KeyRound,
    ListFilter,
    MessageSquare,
    Quote,
    Search,
    ShieldCheck,
    ShoppingCart,
    Tag,
    Terminal,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { RATE_LIMIT_DEFAULTS, resourceList, type ResourceKey } from '@mockapis/api-spec';
import { CodeBlock } from '@/components/code/code-block';
import { SnippetTabs } from '@/components/code/snippet-tabs';
import { LiveSample } from '@/components/home/live-sample';
import { Callout } from '@/components/ui/callout';
import { buttonClasses } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { getEndpointView, resourceTotal } from '@/lib/docs';
import { highlightCode } from '@/lib/highlight';
import { API_ROOT_URL } from '@/lib/site';
import { buildSnippets } from '@/lib/snippets';

const RESOURCE_ICONS: Record<ResourceKey, LucideIcon> = {
    users: Users,
    products: Tag,
    posts: FileText,
    comments: MessageSquare,
    todos: CheckSquare,
    carts: ShoppingCart,
    recipes: ChefHat,
    quotes: Quote,
};

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: ListFilter, title: 'Pagination, sorting & filters', text: 'limit/skip pagination with totals, sortBy/order, field selection, and resource-specific filters.' },
    { icon: Search, title: 'Search', text: 'Case-insensitive search endpoints with predictable empty results.' },
    { icon: KeyRound, title: 'Demo authentication', text: 'Login, register, refresh, and bearer-protected routes with real 401/403 behavior.' },
    { icon: Clock, title: 'Delays & status codes', text: 'Add ?delay=ms to any endpoint or request any common status code to test your UI states.' },
    { icon: ShieldCheck, title: 'Consistent errors', text: 'Every error has the same JSON shape with a code and a request ID you can trace.' },
    { icon: Gauge, title: 'OpenAPI 3', text: 'A machine-readable spec generated from the same source as the API and these docs.' },
];

export default async function HomePage() {
    const sample = getEndpointView('users.get')!;
    const create = getEndpointView('users.create')!;
    const [sampleSnippets, createSnippets] = await Promise.all([buildSnippets(sample.success.request), buildSnippets(create.success.request)]);
    const sampleResponse = sample.success.response;
    const sampleHtml = sampleResponse ? await highlightCode(sampleResponse.body, 'json') : undefined;

    return (
        <main id="main">
            <section className="relative overflow-hidden border-b border-border">
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_60%)]" />
                <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
                    <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
                        <span className="size-1.5 rounded-full bg-accent" /> Free · No API key · CORS enabled
                    </p>
                    <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Mock REST APIs for learning, building, and testing</h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted">
                        Realistic synthetic data, simulated CRUD, demo authentication, and HTTP testing utilities. Point your app, tutorial, or test suite at Mock APIs and start
                        sending requests.
                    </p>
                    <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-lg border border-border bg-surface p-1.5 pl-4 text-left">
                        <span className="text-xs font-medium text-muted">Base URL</span>
                        <code className="min-w-0 flex-1 truncate font-mono text-sm">{API_ROOT_URL}</code>
                        <CopyButton value={API_ROOT_URL} label="Copy base URL" showText />
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Link href="/docs/quickstart" className={buttonClasses({ size: 'lg' })}>
                            Get started <ArrowRight aria-hidden className="size-4" />
                        </Link>
                        <Link href="/playground" className={buttonClasses({ size: 'lg', variant: 'outline' })}>
                            <Terminal aria-hidden className="size-4" /> Open playground
                        </Link>
                        <Link href="/endpoints" className={buttonClasses({ size: 'lg', variant: 'ghost' })}>
                            <BookOpen aria-hidden className="size-4" /> Browse endpoints
                        </Link>
                    </div>
                </div>
            </section>

            <section aria-labelledby="try-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                <h2 id="try-heading" className="text-2xl font-semibold tracking-tight">Try it right now</h2>
                <p className="mt-2 text-muted">Pick a language, copy the snippet, or run the request from your browser.</p>
                <div className="mt-6">
                    <LiveSample endpointId={sample.id} request={sample.success.request} snippets={sampleSnippets} sample={sampleResponse && { ...sampleResponse, html: sampleHtml }} />
                </div>
            </section>

            <section aria-labelledby="resources-heading" className="border-y border-border bg-surface/50">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                    <h2 id="resources-heading" className="text-2xl font-semibold tracking-tight">Resources</h2>
                    <p className="mt-2 text-muted">Eight related datasets. Every record is synthetic and deterministic, so tutorials and tests stay reproducible.</p>
                    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {resourceList.map((resource) => {
                            const Icon = RESOURCE_ICONS[resource.key];
                            const total = resourceTotal(resource.key);
                            return (
                                <li key={resource.key}>
                                    <Link href={`/docs/resources/${resource.key}`} className="group flex h-full flex-col rounded-lg border border-border bg-bg p-5 transition-colors hover:border-accent">
                                        <span className="flex items-center justify-between">
                                            <Icon aria-hidden className="size-5 text-accent" />
                                            <span className="text-xs text-muted">{resource.mutable ? 'read + simulated write' : 'read-only'}</span>
                                        </span>
                                        <span className="mt-4 font-mono text-sm font-semibold">/{resource.key}</span>
                                        <span className="mt-1 text-sm text-muted">{total !== undefined ? `${total} records` : resource.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Link href="/docs/authentication" className="flex items-center gap-4 rounded-lg border border-border bg-bg p-5 transition-colors hover:border-accent">
                            <KeyRound aria-hidden className="size-5 shrink-0 text-accent" />
                            <span>
                                <span className="block font-semibold">Demo authentication</span>
                                <span className="text-sm text-muted">/auth/login, /auth/register, /auth/me, /auth/refresh</span>
                            </span>
                        </Link>
                        <Link href="/docs/http-testing" className="flex items-center gap-4 rounded-lg border border-border bg-bg p-5 transition-colors hover:border-accent">
                            <FlaskConical aria-hidden className="size-5 shrink-0 text-accent" />
                            <span>
                                <span className="block font-semibold">HTTP testing utilities</span>
                                <span className="text-sm text-muted">/test/echo, /test/delay, /test/status/:code</span>
                            </span>
                        </Link>
                    </div>
                </div>
            </section>

            <section aria-labelledby="quickstart-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                <h2 id="quickstart-heading" className="text-2xl font-semibold tracking-tight">Quickstart</h2>
                <ol className="mt-8 grid gap-6 md:grid-cols-3">
                    <li className="rounded-lg border border-border p-5">
                        <span className="font-mono text-xs text-accent">01</span>
                        <h3 className="mt-2 font-semibold">Fetch some data</h3>
                        <p className="mt-1 text-sm text-muted">No signup or key. Send a GET request from any language or tool.</p>
                        <CodeBlock code={`curl '${API_ROOT_URL}/products?limit=5'`} lang="bash" title="Terminal" className="mb-0" />
                    </li>
                    <li className="rounded-lg border border-border p-5">
                        <span className="font-mono text-xs text-accent">02</span>
                        <h3 className="mt-2 font-semibold">Shape the response</h3>
                        <p className="mt-1 text-sm text-muted">Paginate, sort, select fields, filter, and search with query parameters.</p>
                        <CodeBlock code={`curl '${API_ROOT_URL}/products?sortBy=price&order=desc&select=title,price'`} lang="bash" title="Terminal" className="mb-0" />
                    </li>
                    <li className="rounded-lg border border-border p-5">
                        <span className="font-mono text-xs text-accent">03</span>
                        <h3 className="mt-2 font-semibold">Practice writes</h3>
                        <p className="mt-1 text-sm text-muted">POST, PUT, PATCH, and DELETE return realistic responses without changing shared data.</p>
                        <CodeBlock code={`curl -X DELETE '${API_ROOT_URL}/todos/1' -i`} lang="bash" title="Terminal" className="mb-0" />
                    </li>
                </ol>
            </section>

            <section aria-labelledby="languages-heading" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
                <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
                    <div>
                        <h2 id="languages-heading" className="text-2xl font-semibold tracking-tight">Works with your stack</h2>
                        <p className="mt-2 text-muted">
                            Every endpoint in the docs has copy-ready snippets for cURL, fetch, Axios, Dart (Dio and http), and Python requests. This one creates a user:
                        </p>
                        <ul className="mt-6 space-y-3 text-sm">
                            {FEATURES.map((feature) => (
                                <li key={feature.title} className="flex gap-3">
                                    <feature.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
                                    <span>
                                        <span className="font-medium">{feature.title}.</span> <span className="text-muted">{feature.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <SnippetTabs snippets={createSnippets} title="Create a user" />
                </div>
            </section>

            <section aria-labelledby="simulated-heading" className="border-t border-border bg-surface/50">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
                    <h2 id="simulated-heading" className="text-2xl font-semibold tracking-tight">Simulated writes vs. persistent data</h2>
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div className="rounded-lg border border-border bg-bg p-5">
                            <h3 className="font-semibold">What happens when you write</h3>
                            <p className="mt-2 text-sm leading-6 text-muted">
                                POST, PUT, PATCH, and DELETE are validated exactly like a real API and return realistic responses: <code className="font-mono">201</code> with a new
                                ID, the merged record, or <code className="font-mono">204</code>. Responses carry an <code className="font-mono">X-MockAPIs-Simulated: true</code>{' '}
                                header.
                            </p>
                        </div>
                        <div className="rounded-lg border border-border bg-bg p-5">
                            <h3 className="font-semibold">Why nothing is saved</h3>
                            <p className="mt-2 text-sm leading-6 text-muted">
                                The dataset is shared by everyone. Keeping it read-only means tutorials always show the same results and nobody can vandalize or leak data. If you
                                need changes to stick, keep them in your app state or a local mock.
                            </p>
                        </div>
                    </div>
                    <Callout variant="warning" title="Fair use" className="mt-8">
                        <p>
                            Mock APIs is a shared practice service. Requests are rate limited per IP (by default {RATE_LIMIT_DEFAULTS.max} requests per minute) and there is no
                            uptime guarantee. Do not use it for production traffic, load testing, or real personal data, and never use the demo authentication to protect a real
                            application. See{' '}
                            <Link href="/docs/rate-limits" className="underline underline-offset-2">
                                rate limits
                            </Link>{' '}
                            for details.
                        </p>
                    </Callout>
                </div>
            </section>
        </main>
    );
}
