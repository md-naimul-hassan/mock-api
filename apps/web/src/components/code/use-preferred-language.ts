'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { SNIPPET_LANGUAGES, type SnippetLanguage } from '@/lib/codegen';

const STORAGE_KEY = 'mockapis:snippet-language';
const EVENT = 'mockapis:snippet-language';
const DEFAULT: SnippetLanguage = 'curl';

const isLanguage = (value: string | null): value is SnippetLanguage => SNIPPET_LANGUAGES.some((language) => language.id === value);

function read(): SnippetLanguage {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return isLanguage(stored) ? stored : DEFAULT;
    } catch {
        return DEFAULT;
    }
}

function subscribe(callback: () => void) {
    window.addEventListener(EVENT, callback);
    window.addEventListener('storage', callback);
    return () => {
        window.removeEventListener(EVENT, callback);
        window.removeEventListener('storage', callback);
    };
}

/** Snippet language shared by every code sample on the site and remembered across visits. */
export function usePreferredLanguage(): [SnippetLanguage, (language: string) => void] {
    const language = useSyncExternalStore(subscribe, read, () => DEFAULT);
    const setLanguage = useCallback((next: string) => {
        if (!isLanguage(next)) return;
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage unavailable: the choice applies until the page reloads.
        }
        window.dispatchEvent(new Event(EVENT));
    }, []);
    return [language, setLanguage];
}
