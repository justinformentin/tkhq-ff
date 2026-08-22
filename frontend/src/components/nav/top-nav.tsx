import { getSideNavWidth, TOP_NAV_HEIGHT } from './side-nav/constants';
import { EnvSelector } from '@/components/EnvSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';

type TopNavProps = {
  sidebarExpanded?: boolean;
};

export function TopNav({ sidebarExpanded = true }: TopNavProps) {
  return (
    <header
      className="fixed right-0 top-0 z-30 flex items-center justify-between border-b border-border bg-card-background px-5 transition-[left] duration-300 ease-in-out"
      style={{
        left: getSideNavWidth(sidebarExpanded),
        height: TOP_NAV_HEIGHT,
      }}
    >
      {/* Left: breadcrumb placeholder */}
      <div className="min-w-0 flex-1" />

      {/* Right: theme toggle + env selector + user menu */}
      <div className="ml-4 flex shrink-0 items-center gap-4">
        <UserMenu />
        <ThemeToggle />
        <EnvSelector />
      </div>
    </header>
  );
}
