export interface NavItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export const RESOURCE_NAV: NavItem[] = [
    { title: 'Users', href: '/docs/resources/users' },
    { title: 'Products', href: '/docs/resources/products' },
    { title: 'Posts', href: '/docs/resources/posts' },
    { title: 'Comments', href: '/docs/resources/comments' },
    { title: 'Todos', href: '/docs/resources/todos' },
    { title: 'Carts', href: '/docs/resources/carts' },
    { title: 'Recipes', href: '/docs/resources/recipes' },
    { title: 'Quotes', href: '/docs/resources/quotes' },
];

export const DOCS_NAV: NavGroup[] = [
    {
        title: 'Getting started',
        items: [
            { title: 'Introduction', href: '/docs' },
            { title: 'Quickstart', href: '/docs/quickstart' },
            { title: 'Getting started', href: '/docs/getting-started' },
        ],
    },
    { title: 'Resources', items: RESOURCE_NAV },
    {
        title: 'Guides',
        items: [
            { title: 'Authentication', href: '/docs/authentication' },
            { title: 'Pagination & query params', href: '/docs/query-parameters' },
            { title: 'Errors', href: '/docs/errors' },
            { title: 'Rate limits', href: '/docs/rate-limits' },
            { title: 'HTTP testing utilities', href: '/docs/http-testing' },
            { title: 'FAQ', href: '/docs/faq' },
        ],
    },
    {
        title: 'Reference',
        items: [
            { title: 'API reference', href: '/docs/api-reference' },
            { title: 'OpenAPI spec', href: '/docs/openapi' },
        ],
    },
];

export const ALL_DOC_PAGES = DOCS_NAV.flatMap((group) => group.items);

/** Docs page that documents endpoints of the given section. */
export function sectionHref(section: string) {
    if (section === 'auth') return '/docs/authentication';
    if (section === 'testing') return '/docs/http-testing';
    if (section === 'system') return '/docs/api-reference';
    return `/docs/resources/${section}`;
}
