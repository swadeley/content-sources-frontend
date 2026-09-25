import type { CSSProperties } from 'react';
import type { ButtonProps, CardProps, FlexProps, HeroProps } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import { lightwellConfig } from '../lightwell.config';

/**
 * Lightwell components domain config.
 *
 * Cascade:
 *   Prop / behavior:  lightwell.config.ts → this file → Lw* roots
 *   Presentational:   components.config.css → assemblies/page/page.config.css → unit *.css
 *
 * Covers both tiers within components/:
 *   - primitives/ (LwButton, LwLabel, LwBrand, …)
 *   - assemblies/ (LwPageHeader, LwPageHero, LwDataView, …)
 *
 * Tenant identity (cssPrefix, exportPrefix, brand tokens) comes from lightwell.config.ts.
 * Add component/assembly-specific **prop** defaults here.
 * Padding, font-size, font-weight, spacers → CSS track (not this file; not YAML).
 */

// Re-export tenant identity so consumers can reference it from one place.
export { lightwellConfig };

// ─── Shared merge constraint ─────────────────────────────────────────────────

/** Props that `mergeComponentProps` handles specially — className merges, style deep-merges. */
interface MergeableProps {
  className?: string;
  style?: CSSProperties;
}

// ─── Primitive: LwButton ─────────────────────────────────────────────────────

/** Defaults for `LwButton` — add variant / size here when Lightwell baseline is decided. */
export type LwButtonConfig = Partial<ButtonProps>;

// ─── Assembly: LwCard ────────────────────────────────────────────────────────

/** PF `Card` props forwarded by `LwCard` (excluding children and action — kit owns those slots). */
export type LwCardPassthroughProps = Omit<CardProps, 'children' | 'action'>;

/** Defaults for `LwCard`. Lightwell surfaces use glass by default. */
export type LwCardConfig = Partial<LwCardPassthroughProps>;

// ─── Page family: shared title-stack utility (prop track; padding is CSS) ─────

const pageTitleStackClassName = `${spacing.mXs} ${spacing.pbSm}`;

// ─── Assembly: LwPageHeader (plain chrome) ───────────────────────────────────

/** PF `Flex` props forwarded by `LwPageHeader` (excluding children). */
export type LwPageHeaderPassthroughProps = Omit<FlexProps, 'children' | 'title' | 'ref'>;

/** Defaults for `LwPageHeader` — Flex host + title stack spacing; call-site wins via merge. */
export interface LwPageHeaderConfig extends Partial<LwPageHeaderPassthroughProps> {
  titleStackClassName?: string;
}

// ─── Assembly: LwPageHero (PF Hero) ──────────────────────────────────────────

/** PF `Hero` props forwarded by `LwPageHero` (excluding children / content). */
export type LwPageHeroPassthroughProps = Omit<HeroProps, 'children' | 'content'>;

/** Defaults for `LwPageHero` — Hero host + title stack spacing; call-site wins via merge. */
export interface LwPageHeroConfig extends Partial<LwPageHeroPassthroughProps> {
  titleStackClassName?: string;
}

// ─── Domain config shape ─────────────────────────────────────────────────────

/** Collected defaults for all Lw* units. Extend as primitives and assemblies land. */
export interface LwComponentsConfig {
  button: LwButtonConfig;
  card: LwCardConfig;
  pageHeader: LwPageHeaderConfig;
  pageHero: LwPageHeroConfig;
}

export const componentsConfig: LwComponentsConfig = {
  button: {
    // No Lightwell-specific defaults yet — variant / size land here when decided.
  },
  card: {
    // Lightwell surfaces use glass cards by default.
    isGlass: true,
  },
  pageHeader: {
    titleStackClassName: pageTitleStackClassName,
    justifyContent: { default: 'justifyContentSpaceBetween' },
    alignItems: { default: 'alignItemsFlexStart' },
  },
  pageHero: {
    // Lightwell chrome uses glass theme — keep Hero glass-capable by default.
    isGlass: true,
    titleStackClassName: pageTitleStackClassName,
  },
};

export function getLwButtonDefaults(): LwButtonConfig {
  return { ...componentsConfig.button };
}

export function getLwCardDefaults(): LwCardConfig {
  return { ...componentsConfig.card };
}

export function getLwPageHeaderDefaults(): LwPageHeaderConfig {
  return { ...componentsConfig.pageHeader };
}

export function getLwPageHeroDefaults(): LwPageHeroConfig {
  return { ...componentsConfig.pageHero };
}

// ─── Merge utilities ─────────────────────────────────────────────────────────

/**
 * Merge controller defaults with call-site props.
 *
 * Rules:
 * - Call-site wins on all props except className and style.
 * - className: both values concatenated (defaults first).
 * - style: shallow-merged (call-site wins per key).
 *
 * Note: the initial spread requires `as T` because TypeScript cannot prove that
 * `{ ...Partial<T>, ...T }` equals `T` for generic T. The constraint `T extends
 * MergeableProps` bounds the cast — className and style are always safe to mutate.
 */
export function mergeComponentProps<T extends MergeableProps>(
  defaults: Partial<T>,
  callSite: T,
): T {
  const merged = { ...defaults, ...callSite } as T;
  merged.className = mergeClassNames(defaults.className, callSite.className);
  if (defaults.style || callSite.style) {
    merged.style = { ...defaults.style, ...callSite.style };
  }
  return merged;
}

export function mergeClassNames(...classNames: Array<string | undefined>): string | undefined {
  const merged = classNames.filter(Boolean).join(' ');
  return merged || undefined;
}
