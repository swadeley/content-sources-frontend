import { Hero, type HeroProps } from '@patternfly/react-core';
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
  /** Slot: page title. Ignored when `children` is provided (passthrough mode). */
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  ouiaId?: string;
  /**
   * Passthrough mode: caller owns the full interior.
   * When set, owned slots (`title` / `description` / `actions`) are not rendered.
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

/** Owned slots + PF `Hero` passthrough — `className` / `style` / rest merge onto the Hero root. */
export type LwPageHeroProps = LwPageHeroOwnedProps & Omit<HeroProps, 'children' | 'content'>;

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
 * Logic harness, not a DOM wrapper: root = `Hero`; slots hydrate as children.
 * Sibling of `LwPageHeader` — same slots, Hero surface. Shared padding from `page.config.css`.
 *
 * Composition: `children` → passthrough; otherwise slot args build the interior.
 */
export function LwPageHero({
  title,
  description,
  actions,
  ouiaId,
  children,
  backgroundImage,
  backgroundSrcLight,
  backgroundSrcDark,
  className,
  ...rest
}: LwPageHeroProps) {
  const { titleStackClassName, ...heroDefaults } = getLwPageHeroDefaults();

  const heroProps = mergeComponentProps(heroDefaults, {
    ...rest,
    ...resolveBackgroundSrcs(backgroundImage, backgroundSrcLight, backgroundSrcDark),
    className: mergeClassNames('lw-c-page-hero', className),
  });

  if (children != null) {
    return <Hero {...heroProps}>{children}</Hero>;
  }

  return (
    <Hero {...heroProps}>
      <PageTitleStack
        title={title}
        description={description}
        ouiaId={ouiaId}
        titleStackClassName={titleStackClassName}
      />
      {actions ?? null}
    </Hero>
  );
}

export default LwPageHero;
