import type { ReactNode } from 'react';
import type { ParamDoc } from '@mockapis/api-spec';
import type { FieldDoc } from '@/lib/docs';
import { InlineMarkdown } from './inline-markdown';

export function DocTable({ head, children, caption }: { head: string[]; children: ReactNode; caption?: string }) {
    return (
        <div className="my-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
                {caption ? <caption className="sr-only">{caption}</caption> : null}
                <thead className="bg-surface text-xs text-muted">
                    <tr>
                        {head.map((cell) => (
                            <th key={cell} scope="col" className="px-3 py-2 font-medium">
                                {cell}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border align-top">{children}</tbody>
            </table>
        </div>
    );
}

function paramConstraints(param: ParamDoc): string[] {
    const notes: string[] = [];
    if (param.enum) notes.push(`One of: ${param.enum.join(', ')}`);
    if (param.default !== undefined) notes.push(`Default: ${param.default}`);
    if (param.minimum !== undefined && param.maximum !== undefined) notes.push(`Range: ${param.minimum}-${param.maximum}`);
    else if (param.minimum !== undefined) notes.push(`Min: ${param.minimum}`);
    return notes;
}

export function ParamsTable({ params, caption }: { params: ParamDoc[]; caption: string }) {
    return (
        <DocTable head={['Name', 'In', 'Type', 'Description']} caption={caption}>
            {params.map((param) => (
                <tr key={`${param.in}-${param.name}`}>
                    <td className="px-3 py-2 whitespace-nowrap">
                        <code className="font-mono text-xs font-semibold">{param.name}</code>
                        {param.required ? <span className="ml-1.5 text-[10px] font-semibold tracking-wide text-rose-600 uppercase dark:text-rose-300">required</span> : null}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted">{param.in}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted">{param.type}</td>
                    <td className="px-3 py-2 text-sm">
                        <InlineMarkdown text={param.description} />
                        {paramConstraints(param).map((note) => (
                            <span key={note} className="mt-1 block text-xs text-muted">
                                {note}
                            </span>
                        ))}
                    </td>
                </tr>
            ))}
        </DocTable>
    );
}

export function FieldsTable({ fields, caption, showRequired = true }: { fields: FieldDoc[]; caption: string; showRequired?: boolean }) {
    return (
        <DocTable head={showRequired ? ['Field', 'Type', 'Required', 'Notes'] : ['Field', 'Type', 'Notes']} caption={caption}>
            {fields.map((field) => (
                <tr key={field.name}>
                    <td className="px-3 py-2 whitespace-nowrap">
                        <code className="font-mono text-xs font-semibold">{field.name}</code>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs break-words text-muted">{field.type}</td>
                    {showRequired ? <td className="px-3 py-2 text-xs">{field.required ? 'Yes' : 'No'}</td> : null}
                    <td className="px-3 py-2 text-xs text-muted">{field.description ?? ''}</td>
                </tr>
            ))}
        </DocTable>
    );
}
