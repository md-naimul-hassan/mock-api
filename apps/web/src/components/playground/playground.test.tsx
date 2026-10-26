import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Playground, type PlaygroundPreset } from './playground';

const BASE = 'http://api.test/api/v1';

const presets: PlaygroundPreset[] = [
    { id: 'users.get', label: 'GET /users/{id} - Get a user', group: 'Users', request: { method: 'GET', url: `${BASE}/users/1`, headers: [] } },
    {
        id: 'posts.create',
        label: 'POST /posts - Create a post',
        group: 'Posts',
        request: { method: 'POST', url: `${BASE}/posts`, headers: [{ key: 'Content-Type', value: 'application/json' }], body: '{\n  "title": "Hi"\n}' },
    },
    {
        id: 'auth.me',
        label: 'GET /auth/me - Get the current user',
        group: 'Authentication',
        request: { method: 'GET', url: `${BASE}/auth/me`, headers: [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }] },
    },
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, statusText: status === 200 ? 'OK' : '', headers: { 'content-type': 'application/json' } });

function setup(initial = { method: 'GET' as const, url: `${BASE}/users?limit=5`, headers: [] }) {
    const user = userEvent.setup();
    render(<Playground presets={presets} initial={initial} />);
    return { user, url: () => screen.getByLabelText('Request URL') as HTMLInputElement };
}

describe('Playground', () => {
    it('sends a real request and shows status, body, and history', async () => {
        const fetchMock = vi.fn(async () => json({ users: [{ id: 1, firstName: 'Emily' }], total: 100, skip: 0, limit: 5 }));
        vi.stubGlobal('fetch', fetchMock);
        const { user } = setup();

        await user.click(screen.getByRole('button', { name: /send/i }));

        await screen.findByText('"Emily"');
        expect(fetchMock).toHaveBeenCalledWith(`${BASE}/users?limit=5`, expect.objectContaining({ method: 'GET' }));
        expect(screen.getByText('Response status').parentElement).toHaveTextContent(/200\s*OK.*\d+ ms/);
        const history = screen.getByRole('list', { name: 'Request history' });
        expect(within(history).getByText('/api/v1/users?limit=5')).toBeInTheDocument();
        expect(within(history).getByText('200')).toBeInTheDocument();
        expect(JSON.parse(sessionStorage.getItem('mockapis:playground-history')!)).toHaveLength(1);
    });

    it('shows a network error state when the API is unreachable', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new TypeError('Failed to fetch');
            }),
        );
        const { user } = setup();
        await user.click(screen.getByRole('button', { name: /send/i }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('No response received');
        expect(alert).toHaveTextContent(/CORS/);
        expect(within(screen.getByRole('list', { name: 'Request history' })).getByText('failed')).toBeInTheDocument();
    });

    it('shows API error responses with their status', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => json({ message: 'User with id 999 not found', status: 404, code: 'RESOURCE_NOT_FOUND' }, 404)));
        const { user } = setup();
        await user.click(screen.getByRole('button', { name: /send/i }));
        await screen.findByText('"RESOURCE_NOT_FOUND"');
        expect(screen.getAllByText('404').length).toBeGreaterThan(0);
    });

    it('loads presets, syncs query params with the URL, and resets', async () => {
        const { user, url } = setup();

        await user.selectOptions(screen.getByLabelText('Example'), 'posts.create');
        expect(url().value).toBe(`${BASE}/posts`);
        expect(screen.getByLabelText('HTTP method')).toHaveValue('POST');

        await user.click(screen.getByRole('tab', { name: /params/i }));
        await user.click(screen.getByRole('button', { name: 'Add parameter' }));
        await user.type(screen.getByLabelText('query parameter 1 name'), 'delay');
        await user.type(screen.getByLabelText('query parameter 1 value'), '500');
        expect(url().value).toBe(`${BASE}/posts?delay=500`);

        await user.clear(url());
        await user.type(url(), `${BASE}/todos?completed=true`);
        expect(screen.getByLabelText('query parameter 1 name')).toHaveValue('completed');

        await user.click(screen.getByRole('button', { name: /reset/i }));
        expect(url().value).toBe(`${BASE}/posts`);
    });

    it('sends the JSON body and generates matching code', async () => {
        const fetchMock = vi.fn(async () => json({ id: 101, title: 'Hi' }, 201));
        vi.stubGlobal('fetch', fetchMock);
        const { user } = setup();
        await user.selectOptions(screen.getByLabelText('Example'), 'posts.create');

        const code = screen.getByRole('tabpanel', { name: 'cURL' });
        expect(code).toHaveTextContent(`curl -X POST '${BASE}/posts'`);
        expect(code).toHaveTextContent('"title": "Hi"');

        await user.click(screen.getByRole('tab', { name: 'Python (requests)' }));
        expect(screen.getByRole('tabpanel', { name: 'Python (requests)' })).toHaveTextContent('requests.post(');

        await user.click(screen.getByRole('button', { name: /send/i }));
        await screen.findByText('101');
        const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(init.body).toBe('{\n  "title": "Hi"\n}');
    });

    it('replaces token placeholders with a fresh demo token before sending', async () => {
        const fetchMock = vi.fn(async (url: string) =>
            url.endsWith('/auth/login') ? json({ accessToken: 'demo-access', refreshToken: 'demo-refresh', expiresIn: 1800 }) : json({ id: 1, username: 'emilyc' }),
        );
        vi.stubGlobal('fetch', fetchMock);
        const { user } = setup();
        await user.selectOptions(screen.getByLabelText('Example'), 'auth.me');
        await user.click(screen.getByRole('button', { name: /send/i }));

        await screen.findByText('"emilyc"');
        expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/auth/login`);
        const [meUrl, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
        expect(meUrl).toBe(`${BASE}/auth/me`);
        expect(new Headers(init.headers).get('authorization')).toBe('Bearer demo-access');

        const stored = sessionStorage.getItem('mockapis:playground-history')!;
        expect(stored).not.toContain('demo-access');
        expect(stored).toContain('{{accessToken}}');
    });

    it('restores a request from history', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => json({ id: 1 })));
        const { user, url } = setup();
        await user.selectOptions(screen.getByLabelText('Example'), 'users.get');
        await user.click(screen.getByRole('button', { name: /send/i }));
        await screen.findByRole('button', { name: `Restore GET ${BASE}/users/1` });

        await user.selectOptions(screen.getByLabelText('Example'), 'posts.create');
        expect(url().value).toBe(`${BASE}/posts`);
        await user.click(screen.getByRole('button', { name: `Restore GET ${BASE}/users/1` }));
        expect(url().value).toBe(`${BASE}/users/1`);

        await user.click(screen.getByRole('button', { name: /clear/i }));
        await waitFor(() => expect(screen.queryByRole('list', { name: 'Request history' })).not.toBeInTheDocument());
    });
});
