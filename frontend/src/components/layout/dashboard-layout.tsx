import { useCallback, useEffect, useState } from 'react';
import type * as React from 'react';
import {
  getStoredExpanded,
  SideNav,
} from '@/components/nav/side-nav';
import {
  getSideNavWidth,
  SIDE_NAV_EXPANDED_KEY,
  TOP_NAV_HEIGHT,
} from '@/components/nav/side-nav/constants';
import { TopNav } from '@/components/nav/top-nav';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(() => getStoredExpanded());

  useEffect(() => {
    setSidebarExpanded(getStoredExpanded());
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(SIDE_NAV_EXPANDED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <>
      <SideNav isExpanded={sidebarExpanded} onToggleExpanded={toggleSidebar} />
      <TopNav sidebarExpanded={sidebarExpanded} />
      <main
        className="transition-[margin-left] duration-300 ease-out"
        style={{
          marginLeft: getSideNavWidth(sidebarExpanded),
          paddingTop: TOP_NAV_HEIGHT,
        }}
      >
        {children}
      </main>
    </>
  );
}
