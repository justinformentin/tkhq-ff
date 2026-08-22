import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyTheme,
  isTheme,
  resolveInitialTheme,
  THEME_STORAGE_KEY,
  ThemeContext,
  type Theme,
} from '../lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme);

  // The inline script in index.html has already stamped the attribute for the
  // first paint; this keeps it in step with state on every later change.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Only track the OS while the user hasn't picked a side. Once they have,
  // their choice outlives a change to the system setting.
  useEffect(() => {
    if (isTheme(window.localStorage.getItem(THEME_STORAGE_KEY))) return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) =>
      setThemeState(e.matches ? 'dark' : 'light');

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
