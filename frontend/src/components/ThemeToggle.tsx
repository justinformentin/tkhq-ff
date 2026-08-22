import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-7 p-0 text-subtle-foreground"
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </Button>
  );
}
