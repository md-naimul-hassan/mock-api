import type { Snippet } from '@/components/code/snippet-tabs';
import { generateAllSnippets } from './codegen';
import { TOKEN_PLACEHOLDERS } from './demo-tokens';
import { highlightCode } from './highlight';
import type { RequestSpec } from './request';

/** Shows readable placeholders instead of the internal `{{accessToken}}` markers in published snippets. */
export function withReadablePlaceholders(spec: RequestSpec): RequestSpec {
    const replace = (value: string) => value.split(TOKEN_PLACEHOLDERS.accessToken).join('YOUR_ACCESS_TOKEN').split(TOKEN_PLACEHOLDERS.refreshToken).join('YOUR_REFRESH_TOKEN');
    return { ...spec, url: replace(spec.url), body: spec.body && replace(spec.body), headers: spec.headers.map((header) => ({ ...header, value: replace(header.value) })) };
}

/** Generates and server-highlights snippets in every supported language. */
export async function buildSnippets(spec: RequestSpec): Promise<Snippet[]> {
    const snippets = generateAllSnippets(withReadablePlaceholders(spec));
    return Promise.all(snippets.map(async (snippet) => ({ id: snippet.id, label: snippet.label, highlight: snippet.highlight, code: snippet.code, html: await highlightCode(snippet.code, snippet.highlight) })));
}
