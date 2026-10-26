'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { builderApi, setBuilderSession } from '@/lib/builder-api';

export default function BuilderLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setPending(true);
        try {
            const result = await builderApi.login({ username, password });
            setBuilderSession(result.accessToken, result.user);
            toast.success('Signed in to API Builder');
            router.replace('/builder');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Login failed');
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">API Builder sign in</h1>
            <p className="mt-2 text-sm text-muted">
                Manage your custom mock APIs. Separate from the public demo auth used in docs and the playground.
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <label className="block text-sm">
                    <span className="mb-1.5 block text-muted">Username</span>
                    <input
                        required
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent"
                    />
                </label>
                <label className="block text-sm">
                    <span className="mb-1.5 block text-muted">Password</span>
                    <input
                        required
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                </label>
                <Button type="submit" disabled={pending} className="w-full">
                    {pending ? 'Signing in…' : 'Sign in'}
                </Button>
            </form>
            <p className="mt-6 text-sm text-muted">
                No account yet?{' '}
                <Link href="/builder/register" className="text-accent hover:underline">
                    Create one
                </Link>
            </p>
        </div>
    );
}
