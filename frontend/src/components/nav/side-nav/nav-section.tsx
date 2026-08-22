import { NavItem } from './nav-item';
import type { TNavSection } from './types';
import { ChevronDown, ChevronUp } from 'lucide-react';

type NavSectionProps = {
  section: TNavSection;
  isExpanded: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  currentPath: string;
};

export function NavSection({
  section,
  isExpanded,
  isCollapsed,
  onToggle,
  currentPath,
}: NavSectionProps) {
  const showHeader = !!section.title;
  const showItems = !isExpanded || !showHeader || !isCollapsed;

  return (
    <div className="mt-2">
      <div className="mb-1 h-px bg-white/8" />
      {showHeader && (
        <button
          onClick={onToggle}
          type="button"
          className={[
            'flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg bg-transparent px-2 py-1 transition-opacity duration-200 ease-out',
            !isExpanded ? 'pointer-events-none opacity-0' : '',
          ].join(' ')}
          aria-hidden={!isExpanded}
        >
          <span
            className={[
              'flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden transition-[max-height,opacity] duration-200 ease-out',
              isExpanded ? 'max-h-6 opacity-100' : 'max-h-0 opacity-0',
            ].join(' ')}
          >
            <span className="min-w-0 truncate whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-gray-500">
              {section.title}
            </span>
            <span aria-hidden className="text-gray-500">
              {isCollapsed ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronUp size={14} />
              )}
            </span>
          </span>
        </button>
      )}

      <div
        className={[
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          showItems
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={[
              'space-y-0.5',
              showHeader && isExpanded ? 'mt-1' : '',
            ].join(' ')}
          >
            {section.items.map((item) => (
              <NavItem
                key={item.pathname}
                item={item}
                isActive={
                  item.pathname === '/'
                    ? currentPath === '/'
                    : currentPath.startsWith(item.pathname)
                }
                isExpanded={isExpanded}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
