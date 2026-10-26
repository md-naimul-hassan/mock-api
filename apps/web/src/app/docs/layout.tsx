import type { ReactNode } from 'react';
import { DocsMobileNav, DocsSidebar } from '@/components/layout/docs-sidebar';
import { TableOfContents } from '@/components/layout/table-of-contents';
import { endpointIndex } from '@/lib/docs';

export default function DocsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_13rem]">
            <aside className="hidden lg:block">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 pb-8">
                    <DocsSidebar endpoints={endpointIndex} />
                </div>
            </aside>
            <main id="main" className="min-w-0">
                <DocsMobileNav endpoints={endpointIndex} />
                {children}
            </main>
            <aside className="hidden xl:block">
                <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
                    <TableOfContents />
                </div>
            </aside>
        </div>
    );
}
