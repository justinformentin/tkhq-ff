import type { TNavItem, TNavSection, TSideNavFooterItem } from './types';

export const mainNavItems: TNavItem[] = [
  {
    pathname: '/',
    displayName: 'Home',
    iconName: 'Home',
  },
];

export const navSections: TNavSection[] = [
  {
    title: 'Feature Management',
    items: [
      {
        pathname: '/flags',
        displayName: 'Feature Flags',
        iconName: 'Flag',
      },
      {
        pathname: '/orgs',
        displayName: 'Org Search',
        iconName: 'Search',
      },
    ],
  },
  {
    title: 'Org Operations',
    items: [
      {
        pathname: '/org-ops',
        displayName: 'Org Operations',
        iconName: 'Building2',
      },
    ],
  },
  {
    title: 'Engineering',
    items: [
      {
        pathname: '/migrations',
        displayName: 'Migrations',
        iconName: 'Database',
      },
      { pathname: '/email', displayName: 'Email / SES', iconName: 'Mail' },
    ],
  },
];

export const footerItems: TSideNavFooterItem[] = [
  {
    kind: 'link',
    label: 'Docs',
    iconName: 'BookOpen',
    href: 'https://docs.turnkey.com',
  },
];
