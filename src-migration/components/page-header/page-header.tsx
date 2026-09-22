import { Content, Flex, FlexItem, type FlexProps } from '@patternfly/react-core';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import type { CSSProperties, ReactNode } from 'react';

import { getLwPageHeaderDefaults, mergeComponentProps } from '../config-component';

type LwPageHeaderOwnedProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  ouiaId?: string;
};

/** Owned slots + PF `Flex` passthrough (`className` / `style` merge on the Flex root). */
export type LwPageHeaderProps = LwPageHeaderOwnedProps & Omit<FlexProps, 'children'>;

/**
 * Configured page header harness — title / description / actions.
 * Root is PF `Flex` (Rule 0: no wrapper node). Defaults from `config-component`.
 */
export function LwPageHeader({ title, description, actions, ouiaId, ...props }: LwPageHeaderProps) {
  const { titleStackClassName, ...flexDefaults } = getLwPageHeaderDefaults();
  const flexProps = mergeComponentProps(flexDefaults, props as Omit<FlexProps, 'children'> & { className?: string; style?: CSSProperties });

  return (
    <Flex {...flexProps}>
      <FlexItem>
        <Flex className={titleStackClassName} direction={{ default: 'column' }}>
          {typeof title === 'string' ? <PageHeaderTitle title={title} /> : title}
          {description ? (
            <Content component='p' ouiaId={ouiaId}>
              {description}
            </Content>
          ) : null}
        </Flex>
      </FlexItem>
      {actions ? <FlexItem>{actions}</FlexItem> : null}
    </Flex>
  );
}

export default LwPageHeader;
