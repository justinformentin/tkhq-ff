import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { SIDE_NAV_EXPANDED_KEY, getSideNavWidth } from './constants';
import { mainNavItems, navSections, footerItems } from './nav-config';
import { NavItem } from './nav-item';
import { NavSection } from './nav-section';
import { SideNavFooter } from './side-nav-footer';

export function getStoredExpanded(): boolean {
  const stored = localStorage.getItem(SIDE_NAV_EXPANDED_KEY);
  if (stored === 'false') return false;
  return true;
}

type SideNavProps = {
  className?: string;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
};

export function SideNav({
  className,
  isExpanded: isExpandedProp,
  onToggleExpanded: onToggleExpandedProp,
}: SideNavProps) {
  const { pathname } = useLocation();
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  const isControlled =
    isExpandedProp !== undefined && onToggleExpandedProp != null;
  const isExpanded = isControlled ? isExpandedProp : internalExpanded;

  useEffect(() => {
    if (!isControlled) {
      setInternalExpanded(getStoredExpanded());
    }
  }, [isControlled]);

  const toggleExpanded = useCallback(() => {
    if (isControlled) {
      onToggleExpandedProp?.();
    } else {
      setInternalExpanded((prev) => {
        const next = !prev;
        localStorage.setItem(SIDE_NAV_EXPANDED_KEY, String(next));
        return next;
      });
    }
  }, [isControlled, onToggleExpandedProp]);

  const toggleSection = useCallback((title: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  }, []);

  const liveNavSections = useMemo(() => navSections, []);

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card-background transition-[width] duration-300 ease-out',
        className ?? '',
      ].join(' ')}
      style={{ width: getSideNavWidth(isExpanded) }}
    >
      <div
        className={[
          'flex h-full flex-col pb-6',
          isExpanded ? 'px-4 pt-4' : 'px-3 pt-4',
        ].join(' ')}
      >
        {/* Logo + toggle */}
        <div
          className={[
            'flex w-full min-w-0 items-center mb-6',
            isExpanded ? 'justify-between' : 'justify-center',
          ].join(' ')}
        >
          {isExpanded && (
            <a
              href="/"
              className="flex min-w-0 flex-1 items-center gap-2 no-underline"
            >
              <span className="font-bold text-base tracking-tight text-foreground">
                tkhq-ff
              </span>
            </a>
          )}
          <button
            type="button"
            onClick={toggleExpanded}
            className="flex size-8 items-center justify-center rounded-lg text-subtle-foreground hover:bg-hover-overlay hover:text-foreground transition-colors focus:outline-none"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <ChevronLeft
              size={18}
              className={[
                'transition-transform duration-300 ease-out',
                isExpanded ? 'rotate-0' : 'rotate-180',
              ].join(' ')}
            />
          </button>
        </div>

        {/* Main nav */}
        <nav className="w-full flex-1 overflow-y-auto overflow-x-hidden">
          <div className="space-y-0.5">
            {mainNavItems.map((item) => (
              <NavItem
                key={item.pathname}
                item={item}
                isActive={pathname === '/'}
                isExpanded={isExpanded}
              />
            ))}
          </div>

          {liveNavSections.map((section) => {
            const sectionKey = section.title ?? section.items[0]?.pathname;
            return (
              <NavSection
                key={sectionKey}
                section={section}
                isExpanded={isExpanded}
                isCollapsed={
                  section.title
                    ? (collapsedSections[section.title] ?? false)
                    : false
                }
                onToggle={() => section.title && toggleSection(section.title)}
                currentPath={pathname}
              />
            );
          })}
        </nav>

        <SideNavFooter items={footerItems} isExpanded={isExpanded} />
      </div>
    </aside>
  );
}

export {
  SIDE_NAV_EXPANDED_KEY,
  SIDE_NAV_WIDTH_COLLAPSED_PX,
  SIDE_NAV_WIDTH_EXPANDED_PX,
  TOP_NAV_HEIGHT,
  getSideNavWidth,
} from './constants';
