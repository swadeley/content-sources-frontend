import { Flex, FlexItem, Hero, type HeroProps } from '@patternfly/react-core';
import type { ReactNode } from 'react';

import backgroundSrcDarkDefault from '../../../../assets/background-16-9__dark.png';
import backgroundSrcLightDefault from '../../../../assets/background-16-9__light.png';
import {
  getLwPageHeroDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import { PageTitleStack } from '../page-chrome-slots';
import './page-hero.css';

/** Enable kit 16:9 artwork, or pass custom light/dark image URLs for Hero. */
export type LwPageHeroBackgroundImage =
  | true
  | {
      light: string;
      dark: string;
    };

type LwPageHeroOwnedProps = {
  /** Slot 1 — page title. Ignored in full passthrough (children only, no owned slots). */
  title?: ReactNode;
  /** Slot 1 — supporting copy under the title. */
  description?: ReactNode;
  /** Slot 1 — actions (e.g. Export), beside supporting controls under the title. */
  actions?: ReactNode;
  /**
   * Slot 2 — secondary column (e.g. empty state).
   * When set, hero lays out primary column | aside.
   */
  hasAside?: ReactNode;
  ouiaId?: string;
  /**
   * Slot 1 — supporting controls under the title (e.g. Beacon customer select).
   * Without owned slots → full passthrough; caller owns the Hero interior.
   */
  children?: ReactNode;
  /**
   * Opt-in Hero artwork. Off by default so it doesn't stack on the page-level
   * Lightwell atmosphere (`html.pf-v6-theme-felt` / chrome overrides).
   * `true` → kit 16:9 assets; `{ light, dark }` → custom URLs.
   * Explicit `backgroundSrcLight` / `backgroundSrcDark` still win.
   */
  backgroundImage?: LwPageHeroBackgroundImage;
};

/** Owned slots + PF `Hero` passthrough — `className` / `style` / rest merge onto the Hero root.
 * `title` omitted: kit owns the title slot (ReactNode); HTML `title` would narrow it to string. */
export type LwPageHeroProps = LwPageHeroOwnedProps &
  Omit<HeroProps, 'children' | 'content' | 'title'>;

const resolveBackgroundSrcs = (
  backgroundImage: LwPageHeroBackgroundImage | undefined,
  backgroundSrcLight: string | undefined,
  backgroundSrcDark: string | undefined,
): Pick<HeroProps, 'backgroundSrcLight' | 'backgroundSrcDark'> => {
  if (backgroundSrcLight || backgroundSrcDark) {
    return { backgroundSrcLight, backgroundSrcDark };
  }
  if (!backgroundImage) {
    return {};
  }
  if (backgroundImage === true) {
    return {
      backgroundSrcLight: backgroundSrcLightDefault,
      backgroundSrcDark: backgroundSrcDarkDefault,
    };
  }
  return {
    backgroundSrcLight: backgroundImage.light,
    backgroundSrcDark: backgroundImage.dark,
  };
};

/**
 * Kit **assembly** — structured slots on PatternFly `Hero`.
 * Logic harness, not a DOM wrapper: root = `Hero`.
 *
 * Slots (slot mode):
 *   1. Primary — `title` / `description` / `actions` / `children` (supporting controls)
 *   2. Aside — `hasAside` (e.g. empty state), second column when set
 *
 * Passthrough: `children` only, no owned slots → caller owns the interior.
 */
export function LwPageHero({
  title,
  description,
  actions,
  hasAside,
  ouiaId,
  children,
  backgroundImage,
  backgroundSrcLight,
  backgroundSrcDark,
  className,
  bodyWidth,
  bodyMaxWidth,
  ...rest
}: LwPageHeroProps) {
  const heroDefaults = getLwPageHeroDefaults();
  const hasAsideSlot = hasAside != null && hasAside !== false;

  const heroProps = mergeComponentProps(heroDefaults, {
    ...rest,
    ...resolveBackgroundSrcs(backgroundImage, backgroundSrcLight, backgroundSrcDark),
    // Split layout needs the full hero width — call-site body* props still win.
    bodyWidth: bodyWidth ?? (hasAsideSlot ? '100%' : undefined),
    bodyMaxWidth: bodyMaxWidth ?? (hasAsideSlot ? '100%' : undefined),
    className: mergeClassNames(
      'lw-c-page-hero',
      hasAsideSlot ? 'lw-c-page-hero--split' : undefined,
      className,
    ),
  });

  const hasOwnedSlots = title != null || description != null || actions != null || hasAsideSlot;

  // Full passthrough — caller owns the interior.
  if (children != null && !hasOwnedSlots) {
    return <Hero {...heroProps}>{children}</Hero>;
  }

  const primaryColumn = (
    <Flex
      direction={{ default: 'column' }}
      gap={{ default: 'gap2xl' }}
      className='lw-c-page-hero__primary'
    >
      <PageTitleStack title={title} description={description} ouiaId={ouiaId} />
      {children != null || actions != null ? (
        <Flex
          alignItems={{ default: 'alignItemsFlexEnd' }}
          gap={{ default: 'gapMd' }}
          flexWrap={{ default: 'nowrap' }}
          className='lw-c-page-hero__controls'
        >
          {children != null ? <FlexItem>{children}</FlexItem> : null}
          {actions != null ? <FlexItem>{actions}</FlexItem> : null}
        </Flex>
      ) : null}
    </Flex>
  );

  if (hasAsideSlot) {
    return (
      <Hero {...heroProps}>
        <Flex
          // justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsFlexStart' }}
          gap={{ default: 'gapXl' }}
          className='lw-c-page-hero__split'
          flexWrap={{ default: 'nowrap' }}
        >
          <FlexItem flex={{ default: 'flex_1' }}>{primaryColumn}</FlexItem>
          <FlexItem flex={{ default: 'flex_2' }} className='lw-c-page-hero__aside'>
            {hasAside}
          </FlexItem>
        </Flex>
      </Hero>
    );
  }

  return <Hero {...heroProps}>{primaryColumn}</Hero>;
}

export default LwPageHero;
