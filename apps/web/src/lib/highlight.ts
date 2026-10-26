import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import type { HighlightLanguage } from './codegen';

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter() {
    highlighter ??= createHighlighterCore({
        themes: [import('shiki/themes/github-dark-default.mjs'), import('shiki/themes/github-light-default.mjs')],
        langs: [import('shiki/langs/bash.mjs'), import('shiki/langs/javascript.mjs'), import('shiki/langs/dart.mjs'), import('shiki/langs/python.mjs'), import('shiki/langs/json.mjs')],
        engine: createJavaScriptRegexEngine(),
    });
    return highlighter;
}

/** Returns highlighted HTML with both light and dark colors exposed as CSS variables. */
export async function highlightCode(code: string, lang: HighlightLanguage): Promise<string> {
    const instance = await getHighlighter();
    return instance.codeToHtml(code, {
        lang,
        themes: { light: 'github-light-default', dark: 'github-dark-default' },
        defaultColor: false,
    });
}
