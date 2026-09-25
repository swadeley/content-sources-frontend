import { Content, Flex } from '@patternfly/react-core';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import type { ReactNode } from 'react';

export type PageTitleStackProps = {
  title?: ReactNode;
  description?: ReactNode;
  ouiaId?: string;
  titleStackClassName?: string;
};

/**
 * Shared title + description stack for LwPageHeader and LwPageHero.
 * Page-family internal — not exported from the assemblies barrel.
 */
export function PageTitleStack({
  title,
  description,
  ouiaId,
  titleStackClassName,
}: PageTitleStackProps) {
  return (
    <Flex direction={{ default: 'column' }} className={titleStackClassName}>
      {title != null ? (typeof title === 'string' ? <PageHeaderTitle title={title} /> : title) : null}
      {description ? (
        <Content component='p' ouiaId={ouiaId}>
          {description}
        </Content>
      ) : null}
    </Flex>
  );
}
