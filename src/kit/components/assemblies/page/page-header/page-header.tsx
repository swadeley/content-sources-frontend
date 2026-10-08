import { Flex, Hero, type FlexProps, type HeroProps } from '@patternfly/react-core';
import type { ReactNode } from 'react';

import backgroundSrcDarkDefault from '../../../../assets/background-16-9__dark.png';
import backgroundSrcLightDefault from '../../../../assets/background-16-9__light.png';
import {
  getLwPageHeaderDefaults,
  getLwPageHeaderHeroDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import {
  PageChromeSlot,
  PageChromeSlotFooter,
  PageChromeSlots,
  PageTitleStack,
} from '../page-chrome-slots';
import './page-header.css';

/** Enable kit 16:9 artwork, or pass custom light/dark image URLs (hero surface). */
export type LwPageHeaderBackgroundImage =
  | true
  | {
      light: string;
      dark: string;
    };

type LwPageHeaderOwnedProps = {
  /**
   * Hero surface pre-config: PF `Hero` host + `lw-c-page-header` + `lw-c-page-hero`.
   * Omit / false → plain `Flex` host + `lw-c-page-header` only.
   */
  hero?: boolean;
  /** Slot: page title. Ignored when `children` is set (passthrough). */
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  ouiaId?: string;
  /**
   * Passthrough: caller owns the full interior.
   * When set, owned slots (`title` / `description` / `actions`) are not rendered.
   */
  children?: ReactNode;
  /**
   * Opt-in Hero artwork (hero surface only). Off by default.
   * `true` → kit 16:9 assets; `{ light, dark }` → custom URLs.
   * Explicit `backgroundSrcLight` / `backgroundSrcDark` still win.
   */
  backgroundImage?: LwPageHeaderBackgroundImage;
};

/** Owned slots + plain Flex / Hero passthrough (host depends on `hero`). */
export type LwPageHeaderProps = LwPageHeaderOwnedProps &
  Omit<FlexProps, 'children' | 'title' | 'ref'> &
  Omit<HeroProps, 'children' | 'content' | 'title'>;

const resolveBackgroundSrcs = (
  backgroundImage: LwPageHeaderBackgroundImage | undefined,
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
 * Kit **assembly** — one page header.
 * Plain or hero surface (pre-config: Hero host + two classes). Same passthrough grammar.
 *
 * Composition: `children` → passthrough; else `title` / `description` / `actions` slot-build.
 */
export function LwPageHeader({
  hero = false,
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
}: LwPageHeaderProps) {
  const content =
    children != null ? (
      children
    ) : (
      <PageChromeSlots>
        <PageChromeSlot>
          <PageTitleStack title={title} description={description} ouiaId={ouiaId} />
          {actions != null ? <PageChromeSlotFooter>{actions}</PageChromeSlotFooter> : null}
        </PageChromeSlot>
      </PageChromeSlots>
    );

  if (hero) {
    const heroProps = mergeComponentProps(getLwPageHeaderHeroDefaults(), {
      ...(rest as Omit<HeroProps, 'children' | 'content' | 'title'>),
      ...resolveBackgroundSrcs(backgroundImage, backgroundSrcLight, backgroundSrcDark),
      className: mergeClassNames('lw-c-page-header', 'lw-c-page-hero', className),
    });

    return <Hero {...heroProps}>{content}</Hero>;
  }

  const flexProps = mergeComponentProps(getLwPageHeaderDefaults(), {
    ...(rest as Omit<FlexProps, 'children' | 'title' | 'ref'>),
    className: mergeClassNames('lw-c-page-header', className),
  });

  return <Flex {...flexProps}>{content}</Flex>;
}

export default LwPageHeader;
