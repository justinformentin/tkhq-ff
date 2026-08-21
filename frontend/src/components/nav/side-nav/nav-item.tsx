import { Link } from '@tanstack/react-router';
import * as LucideIcons from 'lucide-react';
import type { TNavItem } from './types';

function NavIcon({ name, size = 20 }: { name: string; size?: number }) {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>;
  const Icon = icons[name];
  if (!Icon) return null;
  return <Icon size={size} />;
}

function isExternalUrl(href: string): boolean {
  return /^https?:\/\//.test(href) || href.startsWith('//');
}

type NavItemProps = {
  item: TNavItem;
  isActive: boolean;
  isExpanded: boolean;
};

export function NavItem({ item, isActive, isExpanded }: NavItemProps) {
  const linkClassName = [
    'flex w-full min-w-0 items-center overflow-hidden rounded-lg no-underline transition-colors duration-150',
    isExpanded ? 'gap-3 px-2 py-1.5' : 'h-9 w-9 justify-center p-0',
    isActive
      ? 'bg-indigo-500/12 text-indigo-400'
      : 'text-gray-400 hover:bg-white/8 hover:text-gray-100',
  ].join(' ');

  const iconClassName = [
    'flex shrink-0 items-center justify-center transition-colors',
    isActive ? 'text-indigo-400' : 'text-gray-500',
  ].join(' ');

  const content = (
    <>
      <span className={iconClassName}>
        <NavIcon name={item.iconName} size={18} />
      </span>
      {isExpanded ? (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden">
          <span
            className={[
              'min-w-0 truncate whitespace-nowrap text-sm',
              isActive ? 'font-medium text-indigo-400' : 'font-normal text-gray-200',
            ].join(' ')}
          >
            {item.displayName}
          </span>
          {item.badge != null && (
            <span className="flex h-5 min-w-5 shrink-0 flex-col items-center justify-center rounded-md bg-indigo-500 px-1.5 py-0.5">
              <span className="text-center text-[11px] font-medium leading-normal text-white">
                {item.badge}
              </span>
            </span>
          )}
        </span>
      ) : (
        <span className="sr-only">{item.displayName}</span>
      )}
    </>
  );

  if (isExternalUrl(item.pathname)) {
    return (
      <a
        href={item.pathname}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        aria-current={isActive ? 'page' : undefined}
        title={!isExpanded ? item.displayName : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={item.pathname}
      className={linkClassName}
      aria-current={isActive ? 'page' : undefined}
      title={!isExpanded ? item.displayName : undefined}
    >
      {content}
    </Link>
  );
}
