import type { Metadata } from 'next';
import Link from 'next/link';
import { MAX_DELAY_MS, PAGINATION, resourceList } from '@mockapis/api-spec';
import { CodeBlock } from '@/components/code/code-block';
import { DocsPage, H2, H3 } from '@/components/docs/docs-page';
import { DocTable } from '@/components/docs/tables';
import { Callout } from '@/components/ui/callout';
import { getEndpointView } from '@/lib/docs';
import { API_ROOT_URL } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Pagination & query parameters',
    description: 'Paginate with limit and skip, sort, select fields, search, filter, and delay Mock APIs responses.',
    alternates: { canonical: '/docs/query-parameters' },
};

export default function QueryParametersPage() {
    const listExample = getEndpointView('users.list')!.success.response?.body ?? '';
    const parsed = JSON.parse(listExample || '{}') as { total?: number; skip?: number; limit?: number };

    return (
        <DocsPage
            href="/docs/query-parameters"
            eyebrow="Guides"
            title="Pagination & query parameters"
            lead="List, search, and relation endpoints share one set of query parameters. Unknown or invalid parameters are rejected with a clear 400 error instead of being silently ignored."
        >
            <H2 id="pagination">Pagination</H2>
            <DocTable head={['Parameter', 'Default', 'Rules']} caption="Pagination parameters">
                <tr>
                    <td className="px-3 py-2 font-mono text-xs">limit</td>
                    <td className="px-3 py-2 text-sm">{PAGINATION.defaultLimit}</td>
                    <td className="px-3 py-2 text-sm">Integer from 1 to {PAGINATION.maxLimit}</td>
                </tr>
                <tr>
                    <td className="px-3 py-2 font-mono text-xs">skip</td>
                    <td className="px-3 py-2 text-sm">0</td>
                    <td className="px-3 py-2 text-sm">Integer, 0 or more. Skipping past the end returns an empty array.</td>
                </tr>
            </DocTable>
            <p>Every list response includes metadata so you can build pagers and infinite scroll:</p>
            <CodeBlock
                lang="json"
                title="Response shape"
                code={JSON.stringify({ users: ['…'], total: parsed.total ?? 100, skip: parsed.skip ?? 0, limit: parsed.limit ?? 2 }, null, 2)}
            />
            <p>
                To get page <em>n</em> (1-based) with page size <em>s</em>, request <code>limit=s&amp;skip=(n-1)*s</code>. There are more pages while{' '}
                <code>skip + limit &lt; total</code>.
            </p>
            <CodeBlock code={`curl '${API_ROOT_URL}/products?limit=10&skip=20'`} lang="bash" title="Page 3 of products" />

            <H2 id="sorting">Sorting</H2>
            <p>
                <code>sortBy</code> picks a sortable field (each resource lists its own) and <code>order</code> is <code>asc</code> (default) or <code>desc</code>. Ties are
                broken by <code>id</code> so pagination stays stable.
            </p>
            <CodeBlock code={`curl '${API_ROOT_URL}/products?sortBy=price&order=desc&limit=5'`} lang="bash" title="Most expensive products" />

            <H2 id="select">Selecting fields</H2>
            <p>
                <code>select</code> takes a comma-separated list of top-level fields. <code>id</code> is always included. Unknown fields return <code>400 INVALID_PARAMETER</code>.
            </p>
            <CodeBlock code={`curl '${API_ROOT_URL}/users?select=firstName,email&limit=3'`} lang="bash" title="Only names and emails" />

            <H2 id="search">Search</H2>
            <p>
                Searchable resources expose <code>/&lt;resource&gt;/search?q=term</code>. Matching is case-insensitive and finds the term anywhere in the searchable fields.
                Special characters are matched literally. When nothing matches you get <code>200</code> with an empty array and <code>total: 0</code>. Search endpoints also
                accept pagination, sorting, and <code>select</code>.
            </p>
            <CodeBlock code={`curl '${API_ROOT_URL}/recipes/search?q=pasta'`} lang="bash" title="Search recipes" />

            <H2 id="filters">Filters</H2>
            <p>List endpoints accept resource-specific filters. Combine as many as you like; all of them must match.</p>
            <DocTable head={['Resource', 'Filters']} caption="Filters per resource">
                {resourceList.map((resource) => (
                    <tr key={resource.key}>
                        <td className="px-3 py-2">
                            <Link href={`/docs/resources/${resource.key}`} className="font-mono text-xs text-accent hover:underline">
                                /{resource.key}
                            </Link>
                        </td>
                        <td className="px-3 py-2 text-sm">
                            {resource.filters.map((filter, index) => (
                                <span key={filter.name}>
                                    {index ? ', ' : null}
                                    <code>{filter.name}</code>
                                </span>
                            ))}
                        </td>
                    </tr>
                ))}
            </DocTable>
            <CodeBlock code={`curl '${API_ROOT_URL}/products?category=smartphones&maxPrice=500'`} lang="bash" title="Affordable smartphones" />

            <H2 id="delay">Delaying responses</H2>
            <p>
                Add <code>delay=&lt;ms&gt;</code> (0 to {MAX_DELAY_MS}) to any data, auth, or relation endpoint to simulate a slow network and test loading states. Delayed
                requests have a stricter <Link href="/docs/rate-limits">rate limit</Link>. For a dedicated endpoint see <code>/test/delay</code>.
            </p>
            <CodeBlock code={`curl '${API_ROOT_URL}/posts?limit=5&delay=1500'`} lang="bash" title="Wait 1.5 seconds" />

            <H2 id="validation">Validation rules</H2>
            <H3 id="validation-errors">What returns 400</H3>
            <ul>
                <li>
                    Values outside the documented range, such as <code>limit=0</code>, <code>limit=101</code>, or <code>skip=-1</code>.
                </li>
                <li>
                    Non-numeric numbers such as <code>limit=ten</code>, or invalid enum values such as <code>order=sideways</code>.
                </li>
                <li>
                    Unknown parameters such as <code>page=2</code>, which usually indicate a typo.
                </li>
                <li>
                    Repeating a parameter, e.g. <code>limit=1&amp;limit=2</code>.
                </li>
            </ul>
            <Callout variant="info">
                <p>
                    Error messages name the offending parameter, e.g. <code>limit must be at most {PAGINATION.maxLimit}</code>. See <Link href="/docs/errors">Errors</Link>.
                </p>
            </Callout>
        </DocsPage>
    );
}
