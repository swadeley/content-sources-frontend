import type { CSSProperties } from 'react';
import type { FlexProps } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

/** PF `Flex` props forwarded by `LwPageHeader` (excluding children / Lw-owned slots). */
export type LwPageHeaderPassthroughProps = Omit<FlexProps, 'children'>;

/** Defaults for `LwPageHeader` — spacing + layout; call-site wins via merge. */
export type LwPageHeaderConfig = Partial<LwPageHeaderPassthroughProps> & {
  titleStackClassName?: string;
};

/** Shared defaults for `Lw*` kit components under `src-migration`. */
export type LwComponentConfig = {
  pageHeader: LwPageHeaderConfig;
};

export const componentConfig: LwComponentConfig = {
  pageHeader: {
    justifyContent: { default: 'justifyContentSpaceBetween' },
    alignItems: { default: 'alignItemsFlexStart' },
    className: `${spacing.pxLg} ${spacing.pyMd}`,
    titleStackClassName: `${spacing.mXs} ${spacing.pbSm}`,
  },
};

export function getLwPageHeaderDefaults(): LwPageHeaderConfig {
  return { ...componentConfig.pageHeader };
}

/** Merge controller defaults with call-site props; call-site wins except `className` / `style` merge. */
export function mergeComponentProps<T extends object>(defaults: Partial<T>, props: T): T {
  const propsRecord = props as T & { className?: string; style?: CSSProperties };
  const defaultsRecord = defaults as Partial<T> & { className?: string; style?: CSSProperties };

  const { className: propsClassName, style: propsStyle, ...restProps } = propsRecord;
  const { className: defaultsClassName, style: defaultsStyle, ...restDefaults } = defaultsRecord;

  const className = mergeClassNames(defaultsClassName, propsClassName);
  const style = defaultsStyle || propsStyle ? { ...defaultsStyle, ...propsStyle } : undefined;

  return {
    ...restDefaults,
    ...restProps,
    ...(className ? { className } : {}),
    ...(style ? { style } : {}),
  } as T;
}

export function mergeClassNames(...classNames: (string | undefined)[]): string | undefined {
  const merged = classNames.filter(Boolean).join(' ');
  return merged || undefined;
}
