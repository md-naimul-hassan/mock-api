'use client';

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Toaster } from 'sonner';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'mockapis:theme';
const EVENT = 'mockapis:theme';

/** Inline script that applies the saved theme before first paint (dark is the default). */
export const themeScript = `try{var t=localStorage.getItem('${STORAGE_KEY}');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){}`;

const readTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

function subscribe(callback: () => void) {
    window.addEventListener(EVENT, callback);
    return () => window.removeEventListener(EVENT, callback);
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => undefined });

export function ThemeProvider({ children }: { children: ReactNode }) {
    const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as Theme);
    const toggle = useCallback(() => {
        const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage unavailable: the theme still applies for this page view.
        }
        window.dispatchEvent(new Event(EVENT));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
            <Toaster theme={theme} position="bottom-right" closeButton />
        </ThemeContext.Provider>
    );
}

export function ThemeToggle() {
    const { theme, toggle } = useContext(ThemeContext);
    const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={label}
            title={label}
            className="inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
            {theme === 'dark' ? <Sun aria-hidden className="size-4" /> : <Moon aria-hidden className="size-4" />}
        </button>
    );
}
