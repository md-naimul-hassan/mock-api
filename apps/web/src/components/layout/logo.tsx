export function Logo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden className={className}>
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <path d="M9 11.5 4.5 16 9 20.5M23 11.5l4.5 4.5-4.5 4.5M18.5 9l-5 14" fill="none" stroke="var(--accent-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
