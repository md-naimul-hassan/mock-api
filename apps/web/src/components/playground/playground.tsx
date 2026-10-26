'use client';

import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { History, KeyRound, Play, RotateCcw, Square, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { SNIPPET_LANGUAGES, generateSnippet } from '@/lib/codegen';
import { getDemoTokens } from '@/lib/demo-tokens';
import type { ApiResult } from '@/lib/http';
import { HTTP_METHODS, joinUrl, methodAllowsBody, parseJsonBody, splitUrl, type HttpMethod, type KeyValue, type RequestSpec } from '@/lib/request';
import { cn } from '@/lib/utils';
import { SnippetTabs } from '../code/snippet-tabs';
import { ResponseViewer } from '../request/response-viewer';
import { useRequestRunner } from '../request/use-request-runner';
import { MethodBadge, StatusBadge } from '../ui/badges';
import { Button } from '../ui/button';
import { KeyValueEditor } from '../ui/key-value-editor';
import { Tabs } from '../ui/tabs';
import { createHistoryEntry, HISTORY_LIMIT, loadHistory, saveHistory, type HistoryEntry } from './history';

export interface PlaygroundPreset {
    id: string;
    label: string;
    group: string;
    request: RequestSpec;
}

interface PlaygroundProps {
    presets: PlaygroundPreset[];
    initial: RequestSpec;
    initialPresetId?: string;
}

const readablePlaceholders = (spec: RequestSpec): RequestSpec => {
    const replace = (value: string) => value.split('{{accessToken}}').join('YOUR_ACCESS_TOKEN').split('{{refreshToken}}').join('YOUR_REFRESH_TOKEN');
    return { ...spec, url: replace(spec.url), body: spec.body && replace(spec.body), headers: spec.headers.map((header) => ({ ...header, value: replace(header.value) })) };
};

export function Playground({ presets, initial, initialPresetId }: PlaygroundProps) {
    const id = useId();
    const [baseline, setBaseline] = useState<RequestSpec>(initial);
    const [presetId, setPresetId] = useState(initialPresetId ?? '');
    const [method, setMethod] = useState<HttpMethod>(initial.method);
    const [url, setUrl] = useState(initial.url);
    const [headers, setHeaders] = useState<KeyValue[]>(initial.headers);
    const [body, setBody] = useState(initial.body ?? '');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [tab, setTab] = useState('params');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is only available after hydration
        setHistory(loadHistory());
    }, []);

    const onComplete = useCallback((sent: RequestSpec, result: ApiResult) => {
        setHistory((previous) => {
            const next = [createHistoryEntry(sent, result), ...previous].slice(0, HISTORY_LIMIT);
            saveHistory(next);
            return next;
        });
    }, []);
    const { state, run, cancel, reset } = useRequestRunner(onComplete);

    const request: RequestSpec = useMemo(() => ({ method, url, headers, body: methodAllowsBody(method) ? body : undefined }), [method, url, headers, body]);
    const query = useMemo(() => splitUrl(url).query, [url]);
    const bodyCheck = parseJsonBody(body);
    const snippets = useMemo(() => {
        const readable = readablePlaceholders(request);
        return SNIPPET_LANGUAGES.map((language) => ({ id: language.id, label: language.label, highlight: language.highlight, code: generateSnippet(language.id, readable) }));
    }, [request]);

    const load = (spec: RequestSpec) => {
        setMethod(spec.method);
        setUrl(spec.url);
        setHeaders(spec.headers);
        setBody(spec.body ?? '');
        reset();
    };

    const onPresetChange = (value: string) => {
        setPresetId(value);
        const preset = presets.find((item) => item.id === value);
        if (!preset) return;
        setBaseline(preset.request);
        load(preset.request);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (state.status === 'loading') return;
        void run(request);
    };

    const addDemoToken = async () => {
        try {
            const tokens = await getDemoTokens();
            const others = headers.filter((header) => header.key.trim().toLowerCase() !== 'authorization');
            setHeaders([...others, { key: 'Authorization', value: `Bearer ${tokens.accessToken}` }]);
            setTab('headers');
            toast.success('Added a demo access token (valid for 30 minutes)');
        } catch {
            toast.error('Could not get a demo token. Is the API reachable?');
        }
    };

    const formatBody = () => {
        const parsed = parseJsonBody(body);
        if (parsed.valid && parsed.value !== undefined) setBody(JSON.stringify(parsed.value, null, 2));
        else toast.error('The body is not valid JSON, so it cannot be formatted.');
    };

    const clearHistory = () => {
        setHistory([]);
        saveHistory([]);
        toast.success('History cleared');
    };

    const groups = useMemo(() => {
        const unique = [...new Set(presets.map((preset) => preset.group))];
        return [...unique.filter((group) => group !== 'System'), ...unique.filter((group) => group === 'System')];
    }, [presets]);

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor={`${id}-preset`} className="text-sm text-muted">
                        Example
                    </label>
                    <select
                        id={`${id}-preset`}
                        value={presetId}
                        onChange={(event) => onPresetChange(event.target.value)}
                        className="h-9 max-w-full min-w-0 flex-1 rounded-md border border-border bg-surface px-2 text-sm sm:max-w-sm"
                    >
                        <option value="">Choose an endpoint example…</option>
                        {groups.map((group) => (
                            <optgroup key={group} label={group}>
                                {presets
                                    .filter((preset) => preset.group === group)
                                    .map((preset) => (
                                        <option key={preset.id} value={preset.id}>
                                            {preset.label}
                                        </option>
                                    ))}
                            </optgroup>
                        ))}
                    </select>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            load(baseline);
                            toast('Request reset');
                        }}
                    >
                        <RotateCcw aria-hidden className="size-3.5" /> Reset
                    </Button>
                </div>

                <form onSubmit={submit} aria-label="Request" className="space-y-4 rounded-lg border border-border bg-surface p-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <label htmlFor={`${id}-method`} className="sr-only">
                            HTTP method
                        </label>
                        <select
                            id={`${id}-method`}
                            value={method}
                            onChange={(event) => setMethod(event.target.value as HttpMethod)}
                            className="h-10 rounded-md border border-border bg-bg px-2 font-mono text-sm font-semibold"
                        >
                            {HTTP_METHODS.map((item) => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                        <label htmlFor={`${id}-url`} className="sr-only">
                            Request URL
                        </label>
                        <input
                            id={`${id}-url`}
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            spellCheck={false}
                            autoComplete="off"
                            className="h-10 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 font-mono text-sm focus-visible:border-accent focus-visible:outline-none"
                        />
                        {state.status === 'loading' ? (
                            <Button type="button" variant="secondary" size="lg" onClick={cancel}>
                                <Square aria-hidden className="size-4" /> Cancel
                            </Button>
                        ) : (
                            <Button type="submit" size="lg">
                                <Play aria-hidden className="size-4" /> Send
                            </Button>
                        )}
                    </div>

                    <Tabs
                        label="Request options"
                        value={tab}
                        onValueChange={setTab}
                        items={[
                            {
                                id: 'params',
                                label: `Params (${query.length})`,
                                content: (
                                    <div className="pt-4">
                                        <KeyValueEditor
                                            name="query parameter"
                                            rows={query}
                                            onChange={(rows) => setUrl(joinUrl(splitUrl(url).base, rows))}
                                            keyPlaceholder="Parameter"
                                            valuePlaceholder="Value"
                                            addLabel="Add parameter"
                                        />
                                    </div>
                                ),
                            },
                            {
                                id: 'headers',
                                label: `Headers (${headers.length})`,
                                content: (
                                    <div className="space-y-3 pt-4">
                                        <KeyValueEditor name="header" rows={headers} onChange={setHeaders} keyPlaceholder="Header" valuePlaceholder="Value" addLabel="Add header" />
                                        <Button variant="outline" size="sm" onClick={addDemoToken}>
                                            <KeyRound aria-hidden className="size-3.5" /> Add demo bearer token
                                        </Button>
                                        <p className="text-xs text-muted">
                                            <code>{'{{accessToken}}'}</code> and <code>{'{{refreshToken}}'}</code> are replaced with fresh demo tokens when you send. Content-Type:
                                            application/json is added automatically when there is a body.
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                id: 'body',
                                label: 'Body',
                                content: (
                                    <div className="pt-4">
                                        {methodAllowsBody(method) ? (
                                            <>
                                                <div className="mb-2 flex items-center justify-between">
                                                    <label htmlFor={`${id}-body`} className="text-xs font-medium text-muted">
                                                        JSON body
                                                    </label>
                                                    <Button variant="ghost" size="sm" onClick={formatBody}>
                                                        <Wand2 aria-hidden className="size-3.5" /> Format
                                                    </Button>
                                                </div>
                                                <textarea
                                                    id={`${id}-body`}
                                                    value={body}
                                                    onChange={(event) => setBody(event.target.value)}
                                                    rows={10}
                                                    spellCheck={false}
                                                    aria-invalid={!bodyCheck.valid}
                                                    placeholder='{ "title": "Hello" }'
                                                    className="w-full rounded-md border border-border bg-bg p-3 font-mono text-xs focus-visible:border-accent focus-visible:outline-none"
                                                />
                                                {!bodyCheck.valid ? (
                                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">Invalid JSON. It will be sent as-is (useful for testing 400 INVALID_JSON).</p>
                                                ) : null}
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted">GET requests do not send a body. Switch the method to POST, PUT, PATCH, or DELETE to add one.</p>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </form>

                <section aria-labelledby={`${id}-response`}>
                    <h2 id={`${id}-response`} className="mb-2 text-sm font-semibold">
                        Response
                    </h2>
                    <ResponseViewer state={state} emptyHint="Press Send to make a real request. The response status, timing, headers, and body appear here." />
                </section>

                <section aria-labelledby={`${id}-code`}>
                    <h2 id={`${id}-code`} className="mb-2 text-sm font-semibold">
                        Code
                    </h2>
                    <SnippetTabs snippets={snippets} title="Generated code" />
                </section>
            </div>

            <aside aria-labelledby={`${id}-history`} className="min-w-0">
                <div className="flex items-center justify-between">
                    <h2 id={`${id}-history`} className="flex items-center gap-2 text-sm font-semibold">
                        <History aria-hidden className="size-4" /> History
                    </h2>
                    {history.length ? (
                        <Button variant="ghost" size="sm" onClick={clearHistory}>
                            <Trash2 aria-hidden className="size-3.5" /> Clear
                        </Button>
                    ) : null}
                </div>
                {history.length === 0 ? (
                    <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-xs text-muted">Requests you send in this tab appear here.</p>
                ) : (
                    <ul className="mt-3 space-y-1" aria-label="Request history">
                        {history.map((entry) => (
                            <li key={entry.id}>
                                <button
                                    type="button"
                                    onClick={() => load(entry.request)}
                                    className={cn('w-full rounded-md border border-transparent p-2 text-left hover:border-border hover:bg-surface')}
                                    aria-label={`Restore ${entry.request.method} ${entry.request.url}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <MethodBadge method={entry.request.method} className="w-14" />
                                        {entry.status ? <StatusBadge status={entry.status} /> : <span className="text-xs text-rose-500">failed</span>}
                                        <span className="ml-auto text-[11px] text-muted">{entry.timeMs} ms</span>
                                    </span>
                                    <span className="mt-1 block truncate font-mono text-xs text-muted">{entry.request.url.replace(/^https?:\/\/[^/]+/, '')}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>
        </div>
    );
}
