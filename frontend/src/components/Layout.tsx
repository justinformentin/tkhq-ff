import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Flag } from 'lucide-react';
import { EnvSelector } from './EnvSelector';

const navItems = [
  { href: '/flags', label: 'Feature Flags' },
  { href: '/org-search', label: 'Org Search' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <header
        className="border-b sticky top-0 z-10 backdrop-blur"
        style={{
          backgroundColor: 'rgba(17, 24, 39, 0.8)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-14">
            <Link
              to="/flags"
              className="flex items-center gap-2 font-bold text-base tracking-tight"
              style={{ color: 'var(--color-text)' }}
            >
              <Flag size={18} style={{ color: 'var(--color-primary)' }} />
              tkhq-ff
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    location.pathname.startsWith(item.href)
                      ? 'text-white'
                      : 'hover:text-white'
                  )}
                  style={
                    location.pathname.startsWith(item.href)
                      ? { backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text)' }
                      : { color: 'var(--color-text-muted)' }
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto">
              <EnvSelector />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
