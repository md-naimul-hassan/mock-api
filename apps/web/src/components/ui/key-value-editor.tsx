'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { KeyValue } from '@/lib/request';
import { Button } from './button';

interface KeyValueEditorProps {
    rows: KeyValue[];
    onChange: (rows: KeyValue[]) => void;
    keyPlaceholder: string;
    valuePlaceholder: string;
    addLabel: string;
    name: string;
}

const inputClass =
    'h-8 min-w-0 flex-1 rounded-md border border-border bg-bg px-2 font-mono text-xs text-fg placeholder:text-muted/70 focus-visible:border-accent focus-visible:outline-none';

export function KeyValueEditor({ rows, onChange, keyPlaceholder, valuePlaceholder, addLabel, name }: KeyValueEditorProps) {
    const update = (index: number, patch: Partial<KeyValue>) => onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

    return (
        <div className="space-y-2">
            {rows.length === 0 ? <p className="text-xs text-muted">No {name} yet.</p> : null}
            {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input aria-label={`${name} ${index + 1} name`} className={inputClass} placeholder={keyPlaceholder} value={row.key} onChange={(event) => update(index, { key: event.target.value })} />
                    <input
                        aria-label={`${name} ${index + 1} value`}
                        className={inputClass}
                        placeholder={valuePlaceholder}
                        value={row.value}
                        onChange={(event) => update(index, { value: event.target.value })}
                    />
                    <Button variant="ghost" size="icon" aria-label={`Remove ${name} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>
                        <Trash2 aria-hidden className="size-3.5" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onChange([...rows, { key: '', value: '' }])}>
                <Plus aria-hidden className="size-3.5" />
                {addLabel}
            </Button>
        </div>
    );
}
