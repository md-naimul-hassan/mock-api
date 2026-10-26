import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

vi.mock('@/lib/highlight', () => ({
    highlightCode: async (code: string) => `<pre class="shiki"><code>${code.replace(/</g, '&lt;')}</code></pre>`,
}));

vi.mock('sonner', () => ({
    toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
    Toaster: () => null,
}));

afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    vi.unstubAllGlobals();
});
