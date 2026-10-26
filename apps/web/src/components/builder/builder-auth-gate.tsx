'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clearBuilderSession, getBuilderToken, getBuilderUser, type BuilderUser } from '@/lib/builder-api';

export function BuilderAuthGate({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<BuilderUser | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const token = getBuilderToken();
        const stored = getBuilderUser();
        const validObjectId = typeof stored?.id === 'string' && /^[a-fA-F0-9]{24}$/.test(stored.id);
        if (!token || !stored || !validObjectId) {
            clearBuilderSession();
            router.replace('/builder/login');
            return;
        }
        setUser(stored);
        setReady(true);
    }, [router]);

    if (!ready || !user) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted sm:px-6">
                Checking your builder session…
            </div>
        );
    }

    return (
        <div>
            <div className="border-b border-border bg-surface/50">
                <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <p className="text-sm text-muted">
                        Signed in as <span className="font-medium text-fg">{user.username}</span>
                    </p>
                    <button
                        type="button"
                        className="text-sm text-muted underline-offset-2 hover:text-fg hover:underline"
                        onClick={() => {
                            clearBuilderSession();
                            router.replace('/builder/login');
                        }}
                    >
                        Sign out
                    </button>
                </div>
            </div>
            {children}
        </div>
    );
}
