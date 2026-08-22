import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

export const THEMES: Theme[] = ['light', 'dark'];

export const THEME_STORAGE_KEY = 'tkhq-ff.theme';

/** The attribute global.css keys its dark overrides on. */
export const THEME_ATTRIBUTE = 'data-theme';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

/**
 * A stored choice wins; absent one we follow the OS. Read at startup and again
 * by the inline script in index.html, which has to agree with this to avoid a
 * flash of the wrong theme before React mounts.
 */
export function resolveInitialTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(stored)) return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
