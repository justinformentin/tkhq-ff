import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex size-7 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-hover-overlay hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
