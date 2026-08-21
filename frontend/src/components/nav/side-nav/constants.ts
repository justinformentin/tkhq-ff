export const SIDE_NAV_EXPANDED_KEY = 'tkhq-ff-side-nav-expanded';

export const SIDE_NAV_WIDTH_EXPANDED_PX = 240;
export const SIDE_NAV_WIDTH_COLLAPSED_PX = 68;

export const TOP_NAV_HEIGHT = '44px';

export function getSideNavWidth(isExpanded: boolean): number {
  return isExpanded ? SIDE_NAV_WIDTH_EXPANDED_PX : SIDE_NAV_WIDTH_COLLAPSED_PX;
}
