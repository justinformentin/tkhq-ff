export type TNavItem = {
  pathname: string;
  displayName: string;
  /** lucide-react icon component name */
  iconName: string;
  badge?: number;
};

export type TNavSection = {
  /**
   * When present, the section renders a title header with a collapse control.
   * When omitted, the section is just a separator + items.
   */
  title?: string;
  items: TNavItem[];
};

export type TSideNavFooterItem = {
  label: string;
  iconName: string;
} & ({ kind: 'link'; href: string } | { kind: 'action'; onClick: () => void });
