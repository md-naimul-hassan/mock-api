'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
    id: string;
    label: ReactNode;
    content: ReactNode;
}

interface TabsProps {
    items: TabItem[];
    label: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (id: string) => void;
    actions?: ReactNode;
    className?: string;
    listClassName?: string;
}

/** Accessible tabs (WAI-ARIA tabs pattern with arrow-key navigation). Works controlled or uncontrolled. */
export function Tabs({ items, label, value, defaultValue, onValueChange, actions, className, listClassName }: TabsProps) {
    const baseId = useId();
    const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
    const active = value ?? internal;
    const refs = useRef<(HTMLButtonElement | null)[]>([]);

    const select = (id: string) => {
        if (value === undefined) setInternal(id);
        onValueChange?.(id);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let next: number;
        if (event.key === 'ArrowRight') next = (index + 1) % items.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else return;
        event.preventDefault();
        select(items[next].id);
        refs.current[next]?.focus();
    };

    return (
        <div className={className}>
            <div className={cn('flex items-center gap-2 border-b border-border', listClassName)}>
                <div role="tablist" aria-label={label} className="-mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
                    {items.map((item, index) => {
                        const selected = item.id === active;
                        return (
                            <button
                                key={item.id}
                                ref={(element) => {
                                    refs.current[index] = element;
                                }}
                                type="button"
                                role="tab"
                                id={`${baseId}-tab-${item.id}`}
                                aria-selected={selected}
                                aria-controls={`${baseId}-panel-${item.id}`}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => select(item.id)}
                                onKeyDown={(event) => onKeyDown(event, index)}
                                className={cn(
                                    'shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                                    selected ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
                                )}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
                {actions ? <div className="flex shrink-0 items-center gap-1 pb-1">{actions}</div> : null}
            </div>
            {items.map((item) => (
                <div
                    key={item.id}
                    role="tabpanel"
                    id={`${baseId}-panel-${item.id}`}
                    aria-labelledby={`${baseId}-tab-${item.id}`}
                    hidden={item.id !== active}
                    tabIndex={0}
                    className="focus-visible:outline-offset-[-2px]"
                >
                    {item.id === active ? item.content : null}
                </div>
            ))}
        </div>
    );
}
