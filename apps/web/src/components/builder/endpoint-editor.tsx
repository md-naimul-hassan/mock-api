'use client';

import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { KeyValueEditor } from '@/components/ui/key-value-editor';
import type { BuilderEndpoint } from '@/lib/builder-api';
import { builderApi } from '@/lib/builder-api';
import type { HttpMethod } from '@/lib/request';
import { methodAllowsBody } from '@/lib/request';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const STATUS_CODES = [200, 201, 202, 204, 400, 401, 403, 404, 405, 409, 410, 418, 422, 429, 500, 501, 502, 503, 504];

const DEFAULT_RESPONSE_BODY = `{
  "success": true,
  "message": "Created successfully",
  "data": { "id": 1 }
}`;

const DEFAULT_REQUEST_BODY = `{
  "name": "Example",
  "email": "user@example.com"
}`;

type EndpointForm = {
    method: HttpMethod;
    path: string;
    statusCode: number;
    requestBodyText: string;
    responseBodyText: string;
    delayMs: number;
    description: string;
    enabled: boolean;
    headers: { key: string; value: string }[];
};

function emptyForm(): EndpointForm {
    return {
        method: 'POST',
        path: '/api/users',
        statusCode: 201,
        requestBodyText: DEFAULT_REQUEST_BODY,
        responseBodyText: DEFAULT_RESPONSE_BODY,
        delayMs: 0,
        description: '',
        enabled: true,
        headers: [{ key: 'Content-Type', value: 'application/json' }],
    };
}

function stringifyBody(value: unknown, fallback = '') {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
}

function formFromEndpoint(endpoint: BuilderEndpoint): EndpointForm {
    return {
        method: endpoint.method,
        path: endpoint.path,
        statusCode: endpoint.statusCode,
        requestBodyText: stringifyBody(endpoint.requestBody, methodAllowsBody(endpoint.method) ? DEFAULT_REQUEST_BODY : ''),
        responseBodyText: stringifyBody(endpoint.responseBody, 'null'),
        delayMs: endpoint.delayMs,
        description: endpoint.description,
        enabled: endpoint.enabled,
        headers:
            Object.keys(endpoint.responseHeaders).length > 0
                ? Object.entries(endpoint.responseHeaders).map(([key, value]) => ({ key, value }))
                : [{ key: '', value: '' }],
    };
}

function parseJsonField(label: string, text: string, { allowEmpty }: { allowEmpty: boolean }): { ok: true; value: unknown } | { ok: false } {
    const trimmed = text.trim();
    if (!trimmed) {
        if (allowEmpty) return { ok: true, value: null };
        toast.error(`${label} is required and must be valid JSON`);
        return { ok: false };
    }
    try {
        return { ok: true, value: JSON.parse(trimmed) as unknown };
    } catch {
        toast.error(`${label} must be valid JSON`);
        return { ok: false };
    }
}

type Props = {
    projectId: string;
    endpoint: BuilderEndpoint | null;
    open: boolean;
    onClose: () => void;
    onSaved: (endpoint: BuilderEndpoint) => void;
};

export function EndpointEditor({ projectId, endpoint, open, onClose, onSaved }: Props) {
    const [form, setForm] = useState<EndpointForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const isNew = endpoint === null;
    const showRequestBody = methodAllowsBody(form.method);

    useEffect(() => {
        if (!open) return;
        setForm(endpoint ? formFromEndpoint(endpoint) : emptyForm());
    }, [open, endpoint]);

    useEffect(() => {
        if (!open) return;
        function onKey(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    async function onSubmit(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        try {
            const responseParsed = parseJsonField('Response body', form.responseBodyText, { allowEmpty: true });
            if (!responseParsed.ok) {
                setSaving(false);
                return;
            }

            let requestBody: unknown = null;
            if (showRequestBody) {
                const requestParsed = parseJsonField('Request body', form.requestBodyText, { allowEmpty: false });
                if (!requestParsed.ok) {
                    setSaving(false);
                    return;
                }
                requestBody = requestParsed.value;
            }

            const responseHeaders = Object.fromEntries(
                form.headers.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]),
            );
            const payload = {
                method: form.method,
                path: form.path,
                statusCode: form.statusCode,
                requestBody,
                responseBody: responseParsed.value,
                responseHeaders,
                delayMs: form.delayMs,
                description: form.description,
                enabled: form.enabled,
            };
            const saved = isNew
                ? await builderApi.createEndpoint(projectId, payload)
                : await builderApi.updateEndpoint(projectId, endpoint!.id, payload);
            toast.success(isNew ? 'Endpoint created' : 'Endpoint saved');
            onSaved(saved);
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not save endpoint');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="endpoint-editor-title">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close dialog" onClick={onClose} />
            <form
                onSubmit={onSubmit}
                className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-xl sm:rounded-xl"
            >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 id="endpoint-editor-title" className="text-lg font-semibold">
                        {isNew ? 'Create endpoint' : 'Edit endpoint'}
                    </h2>
                    <Button type="button" size="icon" variant="ghost" aria-label="Close" onClick={onClose}>
                        <X className="size-4" aria-hidden />
                    </Button>
                </div>

                <div className="space-y-4 overflow-y-auto px-4 py-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-sm">
                            <span className="mb-1 block text-muted">Method</span>
                            <select
                                value={form.method}
                                onChange={(event) => {
                                    const method = event.target.value as HttpMethod;
                                    setForm((current) => ({
                                        ...current,
                                        method,
                                        requestBodyText: methodAllowsBody(method)
                                            ? current.requestBodyText.trim() || DEFAULT_REQUEST_BODY
                                            : '',
                                    }));
                                }}
                                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                            >
                                {METHODS.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm sm:col-span-2">
                            <span className="mb-1 block text-muted">Path</span>
                            <input
                                required
                                value={form.path}
                                onChange={(event) => setForm((current) => ({ ...current, path: event.target.value }))}
                                placeholder="/api/users/:id"
                                className="w-full rounded-md border border-border bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent"
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-sm">
                            <span className="mb-1 block text-muted">Status code</span>
                            <select
                                value={form.statusCode}
                                onChange={(event) => setForm((current) => ({ ...current, statusCode: Number(event.target.value) }))}
                                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                            >
                                {STATUS_CODES.map((code) => (
                                    <option key={code} value={code}>
                                        {code}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm">
                            <span className="mb-1 block text-muted">Delay (ms)</span>
                            <input
                                type="number"
                                min={0}
                                max={5000}
                                value={form.delayMs}
                                onChange={(event) => setForm((current) => ({ ...current, delayMs: Number(event.target.value) }))}
                                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                            />
                        </label>
                        <label className="flex items-center gap-2 self-end pb-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.enabled}
                                onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                            />
                            Enabled
                        </label>
                    </div>

                    <label className="block text-sm">
                        <span className="mb-1 block text-muted">Description</span>
                        <input
                            value={form.description}
                            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                            placeholder="Short summary shown in the API list"
                            className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
                        />
                    </label>

                    {showRequestBody ? (
                        <label className="block text-sm">
                            <span className="mb-1 block text-muted">Request body (JSON)</span>
                            <textarea
                                rows={8}
                                value={form.requestBodyText}
                                onChange={(event) => setForm((current) => ({ ...current, requestBodyText: event.target.value }))}
                                spellCheck={false}
                                required
                                className="w-full rounded-md border border-border bg-code px-3 py-2 font-mono text-xs outline-none focus:border-accent"
                            />
                            <span className="mt-1 block text-xs text-muted">Must be valid JSON. Used as the Try it out / playground example.</span>
                        </label>
                    ) : null}

                    <label className="block text-sm">
                        <span className="mb-1 block text-muted">Response body (JSON)</span>
                        <textarea
                            rows={10}
                            value={form.responseBodyText}
                            onChange={(event) => setForm((current) => ({ ...current, responseBodyText: event.target.value }))}
                            spellCheck={false}
                            className="w-full rounded-md border border-border bg-code px-3 py-2 font-mono text-xs outline-none focus:border-accent"
                        />
                        <span className="mt-1 block text-xs text-muted">Must be valid JSON (or empty for null).</span>
                    </label>

                    <div>
                        <p className="mb-2 text-sm text-muted">Response headers</p>
                        <KeyValueEditor
                            name="response-header"
                            rows={form.headers}
                            onChange={(headers) => setForm((current) => ({ ...current, headers }))}
                            keyPlaceholder="Header"
                            valuePlaceholder="Value"
                            addLabel="Add header"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
