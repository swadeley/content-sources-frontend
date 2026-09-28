export { LwPageHeader } from './page/page-header/page-header';
export type { LwPageHeaderProps } from './page/page-header/page-header';

export { LwPageHero } from './page/page-hero/page-hero';
export type { LwPageHeroProps, LwPageHeroBackgroundImage } from './page/page-hero/page-hero';

/**
 * Compat re-exports — Card / Popover live in primitives (A/B/C).
 * Existing page imports from `assemblies` keep working without touching domain files.
 */
export { LwCard } from '../primitives/card/card';
export type { LwCardProps } from '../primitives/card/card';

export { LwPopover } from '../primitives/popover/popover';
export type { LwPopoverProps } from '../primitives/popover/popover';
