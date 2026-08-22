/**
 * Shared Tailwind class strings for common control patterns.
 * Import these instead of re-declaring them in each page.
 */

export const FIELD =
  'w-full px-3 py-2 rounded-lg border border-border bg-card-background text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const FIELD_MONO = `${FIELD} font-mono`;

export const FIELD_LABEL = 'text-xs mb-1 block text-muted-foreground';

export const PRIMARY_BUTTON =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40';

/** Radix Tabs trigger — active state driven by data attributes. */
export const TAB_TRIGGER =
  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:text-foreground';
