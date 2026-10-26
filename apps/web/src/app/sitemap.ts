import type { MetadataRoute } from 'next';
import { ALL_DOC_PAGES } from '@/lib/nav';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
    const paths = ['/', '/endpoints', '/playground', ...ALL_DOC_PAGES.map((page) => page.href)];
    return paths.map((path) => ({
        url: `${SITE_URL}${path === '/' ? '' : path}`,
        changeFrequency: 'weekly',
        priority: path === '/' ? 1 : path.startsWith('/docs/resources') ? 0.8 : 0.6,
    }));
}
