import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { themeScript, ThemeProvider } from '@/components/layout/theme';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: `${SITE_NAME} - ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: ['fake REST API', 'mock API', 'test API', 'JSON placeholder', 'API playground', 'learn HTTP', 'demo authentication'],
    alternates: { canonical: '/' },
    openGraph: { type: 'website', siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION, url: SITE_URL },
    twitter: { card: 'summary', title: SITE_NAME, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: dark)', color: '#0b0e14' },
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="flex min-h-screen flex-col font-sans">
                <ThemeProvider>
                    <SiteHeader />
                    <div className="flex-1">{children}</div>
                    <SiteFooter />
                </ThemeProvider>
            </body>
        </html>
    );
}
