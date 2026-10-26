import { API_ROOT_URL, SITE_URL } from '@/lib/site';

const TOKEN_KEY = 'mockapis:builder-token';
const USER_KEY = 'mockapis:builder-user';

export type BuilderUser = {
    id: string;
    username: string;
    email: string;
    createdAt: string;
};

export type BuilderProject = {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    basePath: string;
    endpointCount: number;
    createdAt: string;
    updatedAt: string;
};

export type BuilderEndpoint = {
    id: string;
    projectId: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    statusCode: number;
    requestBody: unknown;
    responseBody: unknown;
    responseHeaders: Record<string, string>;
    delayMs: number;
    description: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
};

export type BuilderProjectDetail = BuilderProject & { endpoints: BuilderEndpoint[] };

export type BuilderApiError = {
    message: string;
    status: number;
    code: string;
};

export function getBuilderToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_KEY);
}

export function getBuilderUser(): BuilderUser | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as BuilderUser;
    } catch {
        return null;
    }
}

export function setBuilderSession(accessToken: string, user: BuilderUser) {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearBuilderSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

export function projectPublicUrl(projectId: string, endpointPath = '') {
    const base = `${API_ROOT_URL}/mock-apis/${projectId}`;
    if (!endpointPath) return base;
    return `${base}${endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`}`;
}

/** Shareable docs page for a mock API (Swagger-style viewer). */
export function projectShareUrl(projectId: string) {
    return `${SITE_URL}/builder/share/${projectId}`;
}

export type BuilderPublicProject = BuilderProjectDetail & { sharePath: string };

async function builderFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getBuilderToken();
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${API_ROOT_URL}/builder${path}`, { ...init, headers, cache: 'no-store' });
    const text = await response.text();
    let json: unknown = null;
    if (text) {
        try {
            json = JSON.parse(text);
        } catch {
            json = { message: text };
        }
    }
    if (!response.ok) {
        const error = (json ?? {}) as Partial<BuilderApiError>;
        throw Object.assign(new Error(error.message || `Request failed (${response.status})`), {
            status: response.status,
            code: error.code || 'INTERNAL_ERROR',
        });
    }
    return json as T;
}

export const builderApi = {
    register: (body: { username: string; email: string; password: string }) =>
        builderFetch<{ accessToken: string; user: BuilderUser; expiresInMins: number }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(body),
        }),
    login: (body: { username: string; password: string }) =>
        builderFetch<{ accessToken: string; user: BuilderUser; expiresInMins: number }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(body),
        }),
    me: () => builderFetch<BuilderUser>('/auth/me'),
    listProjects: () => builderFetch<{ projects: BuilderProject[] }>('/projects'),
    getProject: (id: string) => builderFetch<BuilderProjectDetail>(`/projects/${id}`),
    createProject: (body: { name: string; description?: string; enabled?: boolean }) =>
        builderFetch<BuilderProject>('/projects', { method: 'POST', body: JSON.stringify(body) }),
    updateProject: (id: string, body: Partial<{ name: string; description: string; enabled: boolean }>) =>
        builderFetch<BuilderProject>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteProject: (id: string) => builderFetch<{ deleted: boolean; id: string }>(`/projects/${id}`, { method: 'DELETE' }),
    duplicateProject: (id: string) => builderFetch<BuilderProjectDetail>(`/projects/${id}/duplicate`, { method: 'POST' }),
    createEndpoint: (projectId: string, body: Record<string, unknown>) =>
        builderFetch<BuilderEndpoint>(`/projects/${projectId}/endpoints`, { method: 'POST', body: JSON.stringify(body) }),
    updateEndpoint: (projectId: string, endpointId: string, body: Record<string, unknown>) =>
        builderFetch<BuilderEndpoint>(`/projects/${projectId}/endpoints/${endpointId}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }),
    deleteEndpoint: (projectId: string, endpointId: string) =>
        builderFetch<{ deleted: boolean; id: string }>(`/projects/${projectId}/endpoints/${endpointId}`, { method: 'DELETE' }),
    getPublicProject: (projectId: string) => builderFetch<BuilderPublicProject>(`/public/${projectId}`),
};
