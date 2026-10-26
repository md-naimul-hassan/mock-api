import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
    primary: 'bg-accent text-accent-fg hover:opacity-90',
    secondary: 'bg-surface-2 text-fg hover:bg-border',
    outline: 'border border-border bg-transparent text-fg hover:bg-surface-2',
    ghost: 'bg-transparent text-muted hover:bg-surface-2 hover:text-fg',
};

const sizes: Record<Size, string> = {
    sm: 'h-8 gap-1.5 px-3 text-xs',
    md: 'h-9 gap-2 px-4 text-sm',
    lg: 'h-11 gap-2 px-5 text-sm',
    icon: 'h-8 w-8',
};

export function buttonClasses({ variant = 'primary', size = 'md', className }: { variant?: Variant; size?: Size; className?: string } = {}) {
    return cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
    );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
    return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
