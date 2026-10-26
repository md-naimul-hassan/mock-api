import Link from 'next/link';
import { buttonClasses } from '@/components/ui/button';

export default function NotFound() {
    return (
        <main id="main" className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
            <p className="font-mono text-sm text-accent">404</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
            <p className="mt-3 text-muted">This page does not exist. If you were looking for an API endpoint, check the endpoint directory or the API reference.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/" className={buttonClasses()}>
                    Go home
                </Link>
                <Link href="/endpoints" className={buttonClasses({ variant: 'outline' })}>
                    Browse endpoints
                </Link>
            </div>
        </main>
    );
}
