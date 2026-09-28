import { Flex, FlexItem, type FlexProps } from '@patternfly/react-core';
import type { ReactNode } from 'react';

import {
  getLwPageHeaderDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import { PageTitleStack } from '../page-chrome-slots';
import './page-header.css';

type LwPageHeaderOwnedProps = {
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
};

/** Owned slots + PF `Flex` passthrough — `className` / `style` / rest merge onto the Flex root. */
export type LwPageHeaderProps = LwPageHeaderOwnedProps &
  Omit<FlexProps, 'children' | 'title' | 'ref'>;

/**
 * Kit **assembly** — plain page chrome (kit invention; no PF PageHeader).
 * Logic harness: root = `Flex`; shared page padding from `page.config.css`.
 * Sibling of `LwPageHero` — same slots, no Hero surface.
 *
 * Composition: `children` → passthrough; otherwise slot args build the interior.
 */
export function LwPageHeader({
  title,
  description,
  actions,
  ouiaId,
  children,
  className,
  ...rest
}: LwPageHeaderProps) {
  const flexProps = mergeComponentProps(getLwPageHeaderDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-page-header', className),
  });

  if (children != null) {
    return <Flex {...flexProps}>{children}</Flex>;
  }

  return (
    <Flex {...flexProps}>
      <FlexItem>
        <PageTitleStack title={title} description={description} ouiaId={ouiaId} />
      </FlexItem>
      {actions ? <FlexItem>{actions}</FlexItem> : null}
    </Flex>
  );
}

export default LwPageHeader;
