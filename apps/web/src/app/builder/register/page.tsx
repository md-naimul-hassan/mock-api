'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { builderApi, setBuilderSession } from '@/lib/builder-api';

export default function BuilderRegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pending, setPending] = useState(false);

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setPending(true);
        try {
            const result = await builderApi.register({ username, email, password });
            setBuilderSession(result.accessToken, result.user);
            toast.success('Builder account created');
            router.replace('/builder');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setPending(false);
        }
    }

    return (
        <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
            <h1 className="text-2xl font-semibold tracking-tight">Create a builder account</h1>
            <p className="mt-2 text-sm text-muted">
                Accounts are for managing your mock APIs only. Public runtime URLs stay callable without signing in.
            </p>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <label className="block text-sm">
                    <span className="mb-1.5 block text-muted">Username</span>
                    <input
                        required
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        pattern="[a-z][a-z0-9_]*"
                        title="Lowercase letter first, then letters, digits, underscores"
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent"
                    />
                </label>
                <label className="block text-sm">
                    <span className="mb-1.5 block text-muted">Email</span>
                    <input
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                </label>
                <label className="block text-sm">
                    <span className="mb-1.5 block text-muted">Password (min 8 characters)</span>
                    <input
                        required
                        type="password"
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                </label>
                <Button type="submit" disabled={pending} className="w-full">
                    {pending ? 'Creating…' : 'Create account'}
                </Button>
            </form>
            <p className="mt-6 text-sm text-muted">
                Already have an account?{' '}
                <Link href="/builder/login" className="text-accent hover:underline">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
