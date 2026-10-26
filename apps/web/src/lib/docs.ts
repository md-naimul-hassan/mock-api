import { z } from 'zod';
import {
    capturedExamples,
    endpoints,
    exampleUrl,
    getExamples,
    resources,
    SECTION_LABELS,
    type CapturedResponse,
    type DocSection,
    type EndpointDoc,
    type EndpointGroup,
    type ExampleRequest,
    type ParamDoc,
    type ResourceKey,
    type ResponseDoc,
} from '@mockapis/api-spec';
import { prettyJson } from './json-tokens';
import { sectionHref } from './nav';
import type { HttpMethod, RequestSpec } from './request';
import { API_BASE_URL } from './site';
import { endpointAnchor } from './utils';

export interface FieldDoc {
    name: string;
    type: string;
    required: boolean;
    description?: string;
}

export interface ResponseExampleView {
    status: number;
    contentType: string | null;
    body: string;
    isJson: boolean;
}

export interface ExampleView {
    request: RequestSpec;
    response?: ResponseExampleView;
}

/** Plain, serializable view of an endpoint for pages and client components. */
export interface EndpointView {
    id: string;
    anchor: string;
    href: string;
    method: HttpMethod;
    path: string;
    section: DocSection;
    sectionLabel: string;
    group: EndpointGroup;
    summary: string;
    description: string;
    params: ParamDoc[];
    requestBody?: { description: string; fields: FieldDoc[] };
    requiresAuth: boolean;
    simulated: boolean;
    responses: ResponseDoc[];
    success: ExampleView;
    failure?: ExampleView & { status: number };
}

const capturedBase = capturedExamples.baseUrl;

/** Replaces the base URL the examples were captured against with the configured public API URL. */
const rebase = (text: string) => (capturedBase === API_BASE_URL ? text : text.split(capturedBase).join(API_BASE_URL));

function toRequest(method: HttpMethod, example: ExampleRequest): RequestSpec {
    return {
        method,
        url: `${API_BASE_URL}${exampleUrl(example)}`,
        headers: Object.entries(example.headers ?? {}).map(([key, value]) => ({ key, value })),
        body: example.body === undefined ? undefined : typeof example.body === 'string' ? example.body : prettyJson(example.body),
    };
}

function toResponse(captured: CapturedResponse | undefined): ResponseExampleView | undefined {
    if (!captured) return undefined;
    const isJson = !!captured.contentType?.includes('json');
    const body = captured.body === null || captured.body === undefined ? '' : typeof captured.body === 'string' ? captured.body : prettyJson(captured.body);
    return { status: captured.status, contentType: captured.contentType, body: rebase(body), isJson };
}

type JsonSchema = {
    type?: string | string[];
    format?: string;
    enum?: unknown[];
    items?: JsonSchema;
    properties?: Record<string, JsonSchema>;
    required?: string[];
    description?: string;
    nullable?: boolean;
    anyOf?: JsonSchema[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
};

function describeType(schema: JsonSchema): string {
    if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
    if (schema.anyOf) return schema.anyOf.map(describeType).join(' | ');
    const base = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type ?? 'any';
    if (base === 'array' && schema.items) return `${describeType(schema.items)}[]`;
    const format = schema.format ? ` (${schema.format})` : '';
    return `${base}${format}${schema.nullable ? ' | null' : ''}`;
}

function constraints(schema: JsonSchema): string | undefined {
    const parts: string[] = [];
    if (schema.minLength !== undefined) parts.push(`min length ${schema.minLength}`);
    if (schema.maxLength !== undefined) parts.push(`max length ${schema.maxLength}`);
    if (schema.minimum !== undefined) parts.push(`min ${schema.minimum}`);
    if (schema.maximum !== undefined) parts.push(`max ${schema.maximum}`);
    return parts.length ? parts.join(', ') : undefined;
}

/** Flattens a Zod object schema into documented fields (nested objects use dot notation). */
export function schemaFields(schema: z.ZodType, io: 'input' | 'output' = 'output'): FieldDoc[] {
    const json = z.toJSONSchema(schema, { target: 'openapi-3.0', unrepresentable: 'any', io }) as JsonSchema;
    const fields: FieldDoc[] = [];
    const walk = (node: JsonSchema, prefix: string) => {
        for (const [name, child] of Object.entries(node.properties ?? {})) {
            const path = prefix ? `${prefix}.${name}` : name;
            const required = node.required?.includes(name) ?? false;
            if (child.type === 'object' && child.properties) {
                fields.push({ name: path, type: 'object', required, description: child.description });
                walk(child, path);
            } else {
                fields.push({ name: path, type: describeType(child), required, description: child.description ?? constraints(child) });
            }
        }
    };
    walk(json, '');
    return fields;
}

export function toEndpointView(endpoint: EndpointDoc): EndpointView {
    const captured = getExamples(endpoint.id);
    const anchor = endpointAnchor(endpoint.id);
    return {
        id: endpoint.id,
        anchor,
        href: `${sectionHref(endpoint.section)}#${anchor}`,
        method: endpoint.method,
        path: endpoint.path,
        section: endpoint.section,
        sectionLabel: SECTION_LABELS[endpoint.section],
        group: endpoint.group,
        summary: endpoint.summary,
        description: endpoint.description,
        params: endpoint.params,
        requestBody: endpoint.requestBody
            ? { description: endpoint.requestBody.description, fields: schemaFields(endpoint.requestBody.schema, 'input') }
            : undefined,
        requiresAuth: !!endpoint.requiresAuth,
        simulated: !!endpoint.simulated,
        responses: endpoint.responses,
        success: { request: toRequest(endpoint.method, endpoint.example), response: toResponse(captured?.success) },
        failure:
            endpoint.failure && endpoint.failureStatus
                ? { status: endpoint.failureStatus, request: toRequest(endpoint.method, endpoint.failure), response: toResponse(captured?.failure) }
                : undefined,
    };
}

export const endpointViews: EndpointView[] = endpoints.map(toEndpointView);

export const endpointViewsBySection = (section: DocSection) => endpointViews.filter((endpoint) => endpoint.section === section);

export const getEndpointView = (id: string) => endpointViews.find((endpoint) => endpoint.id === id);

/** Number of records in a resource, taken from the captured list example (i.e. from the real API). */
export function resourceTotal(key: ResourceKey): number | undefined {
    const body = getExamples(`${key}.list`)?.success?.body as { total?: number } | undefined;
    return body?.total;
}

export function resourceFields(key: ResourceKey) {
    return schemaFields(resources[key].schema);
}

/** Lightweight index used by the sidebar search and endpoint directory. */
export interface EndpointIndexEntry {
    id: string;
    method: HttpMethod;
    path: string;
    summary: string;
    group: EndpointGroup;
    sectionLabel: string;
    href: string;
    simulated: boolean;
    requiresAuth: boolean;
}

export const endpointIndex: EndpointIndexEntry[] = endpointViews.map(({ id, method, path, summary, group, sectionLabel, href, simulated, requiresAuth }) => ({
    id,
    method,
    path,
    summary,
    group,
    sectionLabel,
    href,
    simulated,
    requiresAuth,
}));
