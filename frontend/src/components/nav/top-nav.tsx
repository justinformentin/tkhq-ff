import { getSideNavWidth, TOP_NAV_HEIGHT } from './side-nav/constants';
import { EnvSelector } from '@/components/EnvSelector';
import { UserMenu } from '@/components/UserMenu';

type TopNavProps = {
  sidebarExpanded?: boolean;
};

export function TopNav({ sidebarExpanded = true }: TopNavProps) {
  return (
    <header
      className="fixed right-0 top-0 z-30 flex items-center justify-between border-b border-white/10 px-5 transition-[left] duration-300 ease-in-out"
      style={{
        left: getSideNavWidth(sidebarExpanded),
        height: TOP_NAV_HEIGHT,
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Left: breadcrumb placeholder */}
      <div className="min-w-0 flex-1" />

      {/* Right: env selector + user menu */}
      <div className="ml-4 flex shrink-0 items-center gap-4">
        <UserMenu />
        <EnvSelector />
      </div>
    </header>
  );
}
