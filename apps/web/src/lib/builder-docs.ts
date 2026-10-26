import { projectPublicUrl, type BuilderEndpoint } from '@/lib/builder-api';
import type { HttpMethod, RequestSpec } from '@/lib/request';
import { methodAllowsBody } from '@/lib/request';

/** Group endpoints like Swagger tags — prefer `/api/{resource}` then first path segment. */
export function endpointTag(path: string): string {
    const parts = path.split('/').filter(Boolean);
    if (parts[0]?.toLowerCase() === 'api' && parts[1]) return parts[1];
    return parts[0] || 'default';
}

export function groupEndpointsByTag(endpoints: BuilderEndpoint[]): { tag: string; endpoints: BuilderEndpoint[] }[] {
    const order: string[] = [];
    const map = new Map<string, BuilderEndpoint[]>();
    for (const endpoint of endpoints) {
        const tag = endpointTag(endpoint.path);
        if (!map.has(tag)) {
            map.set(tag, []);
            order.push(tag);
        }
        map.get(tag)!.push(endpoint);
    }
    const methodRank: Record<string, number> = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };
    return order.map((tag) => ({
        tag,
        endpoints: [...(map.get(tag) ?? [])].sort((a, b) => {
            const pathCmp = a.path.localeCompare(b.path);
            if (pathCmp !== 0) return pathCmp;
            return (methodRank[a.method] ?? 9) - (methodRank[b.method] ?? 9);
        }),
    }));
}

export function extractPathParams(path: string): string[] {
    return path
        .split('/')
        .filter((part) => part.startsWith(':') && part.length > 1)
        .map((part) => part.slice(1));
}

export function fillPathParams(path: string, values: Record<string, string>): string {
    return path
        .split('/')
        .map((part) => {
            if (!part.startsWith(':') || part.length < 2) return part;
            const key = part.slice(1);
            const value = values[key];
            return value ? encodeURIComponent(value) : part;
        })
        .join('/');
}

export function asRequestMethod(method: string): HttpMethod {
    return method as HttpMethod;
}

/** Replace `:id`-style params with sample values so playground requests are runnable. */
export function examplePath(path: string): string {
    return path
        .split('/')
        .map((part) => {
            if (!part.startsWith(':') || part.length < 2) return part;
            const name = part.slice(1).toLowerCase();
            if (name === 'id' || name.endsWith('id')) return '1';
            return 'example';
        })
        .join('/');
}

export function builderEndpointToRequest(projectId: string, endpoint: BuilderEndpoint): RequestSpec {
    const method = asRequestMethod(endpoint.method);
    const allowsBody = methodAllowsBody(method);
    let body: string | undefined;
    if (allowsBody) {
        if (endpoint.requestBody === undefined || endpoint.requestBody === null) {
            body = '{\n  \n}';
        } else if (typeof endpoint.requestBody === 'string') {
            body = endpoint.requestBody;
        } else {
            body = JSON.stringify(endpoint.requestBody, null, 2);
        }
    }
    return {
        method,
        url: projectPublicUrl(projectId, examplePath(endpoint.path)),
        headers: allowsBody ? [{ key: 'Content-Type', value: 'application/json' }] : [],
        body,
    };
}

/** Playground presets for a mock API project's endpoints. */
export function builderPlaygroundPresets(projectId: string, endpoints: BuilderEndpoint[]) {
    return endpoints.map((endpoint) => ({
        id: endpoint.id,
        label: `${endpoint.method} ${endpoint.path}${endpoint.description ? ` — ${endpoint.description}` : ''}`,
        group: endpointTag(endpoint.path),
        request: builderEndpointToRequest(projectId, endpoint),
    }));
}
