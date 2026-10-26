const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

const vercelOrigin = () => {
    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    return host ? `https://${host}` : '';
};

/** Public API origin, e.g. `https://api.example.com`. Empty string = same origin (Vercel services). */
export const API_BASE_URL = trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? (process.env.VERCEL ? '' : 'http://localhost:4000'),
);

/** Public URL of this website, used for canonical URLs and the sitemap. */
export const SITE_URL = trimTrailingSlash(
    process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL ? vercelOrigin() || 'http://localhost:3000' : 'http://localhost:3000'),
);

export const API_PREFIX = '/api/v1';
export const API_ROOT_URL = `${API_BASE_URL}${API_PREFIX}`;

export const SITE_NAME = 'Mock APIs';
export const SITE_TAGLINE = 'Free Mock REST APIs for learning, prototyping, and testing.';
export const SITE_DESCRIPTION =
    'Mock APIs is a free public REST API with realistic fake data, simulated CRUD, demo authentication, and HTTP testing utilities. No API key required.';
