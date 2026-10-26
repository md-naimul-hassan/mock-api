import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
    title: `API Builder · ${SITE_NAME}`,
    description: 'Create and customize your own mock API endpoints for frontend development and testing.',
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
    return <main id="main">{children}</main>;
}
