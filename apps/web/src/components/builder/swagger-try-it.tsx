'use client';

import { useId, useMemo, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { ResponseViewer } from '@/components/request/response-viewer';
import { useRequestRunner } from '@/components/request/use-request-runner';
import { Button } from '@/components/ui/button';
import { KeyValueEditor } from '@/components/ui/key-value-editor';
import type { BuilderEndpoint } from '@/lib/builder-api';
import { projectPublicUrl } from '@/lib/builder-api';
import { asRequestMethod, extractPathParams, fillPathParams } from '@/lib/builder-docs';
import { methodAllowsBody, parseJsonBody, type KeyValue } from '@/lib/request';

type Props = {
    projectId: string;
    endpoint: BuilderEndpoint;
};

export function SwaggerTryIt({ projectId, endpoint }: Props) {
    const id = useId();
    const pathParams = useMemo(() => extractPathParams(endpoint.path), [endpoint.path]);
    const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(pathParams.map((name) => [name, ''])),
    );
    const [headers, setHeaders] = useState<KeyValue[]>([{ key: 'Content-Type', value: 'application/json' }]);
    const [body, setBody] = useState(() => {
        if (endpoint.requestBody === undefined || endpoint.requestBody === null) return '{\n  \n}';
        if (typeof endpoint.requestBody === 'string') return endpoint.requestBody;
        return JSON.stringify(endpoint.requestBody, null, 2);
    });
    const { state, run, cancel } = useRequestRunner();

    const method = asRequestMethod(endpoint.method);
    const allowsBody = methodAllowsBody(method);
    const resolvedPath = fillPathParams(endpoint.path, paramValues);
    const url = projectPublicUrl(projectId, resolvedPath);
    const bodyCheck = parseJsonBody(body);
    const missingParams = pathParams.filter((name) => !paramValues[name]?.trim());

    function execute() {
        if (missingParams.length > 0) return;
        if (allowsBody && !bodyCheck.valid) return;
        void run({
            method,
            url,
            headers: headers.filter((row) => row.key.trim()),
            body: allowsBody ? body : '',
        });
    }

    return (
        <div className="space-y-4 rounded-md border border-border bg-bg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Try it out</h4>
                <div className="flex items-center gap-2">
                    {state.status === 'loading' ? (
                        <Button type="button" size="sm" variant="outline" onClick={cancel}>
                            <Square className="size-3.5" aria-hidden /> Cancel
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        size="sm"
                        onClick={execute}
                        disabled={state.status === 'loading' || missingParams.length > 0 || (allowsBody && !bodyCheck.valid)}
                    >
                        <Play className="size-3.5" aria-hidden />
                        {state.status === 'loading' ? 'Sending…' : 'Execute'}
                    </Button>
                </div>
            </div>

            {pathParams.length > 0 ? (
                <fieldset>
                    <legend className="mb-2 text-xs font-medium text-muted">Path parameters</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {pathParams.map((name) => (
                            <label key={name} className="text-sm">
                                <span className="mb-1 flex items-center gap-1.5 font-mono text-xs">
                                    {name}
                                    <span className="rounded bg-rose-500/15 px-1 py-px text-[10px] font-sans font-medium text-rose-700 dark:text-rose-300">
                                        required
                                    </span>
                                </span>
                                <input
                                    value={paramValues[name] ?? ''}
                                    onChange={(event) => setParamValues((current) => ({ ...current, [name]: event.target.value }))}
                                    placeholder={name}
                                    className="w-full rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs outline-none focus:border-accent"
                                />
                            </label>
                        ))}
                    </div>
                    {missingParams.length > 0 ? (
                        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Fill required path parameters before executing.</p>
                    ) : null}
                </fieldset>
            ) : null}

            <fieldset>
                <legend className="mb-2 text-xs font-medium text-muted">Headers</legend>
                <KeyValueEditor
                    name={`header-${id}`}
                    rows={headers}
                    onChange={setHeaders}
                    keyPlaceholder="Header name"
                    valuePlaceholder="Value"
                    addLabel="Add header"
                />
            </fieldset>

            {allowsBody ? (
                <div>
                    <label htmlFor={`${id}-body`} className="text-xs font-medium text-muted">
                        Request body
                    </label>
                    <textarea
                        id={`${id}-body`}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        rows={6}
                        spellCheck={false}
                        aria-invalid={!bodyCheck.valid}
                        className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs outline-none focus:border-accent"
                    />
                    {!bodyCheck.valid ? <p className="mt-1 text-xs text-rose-600">Body must be valid JSON.</p> : null}
                </div>
            ) : null}

            <div>
                <p className="mb-2 text-xs font-medium text-muted">Response</p>
                <ResponseViewer state={state} />
            </div>
        </div>
    );
}
