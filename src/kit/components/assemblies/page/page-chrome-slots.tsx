import { Content, Flex } from '@patternfly/react-core';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import type { ReactNode } from 'react';

import { mergeClassNames } from 'kit/components/components.config';
import './page-chrome-slots.css';

export type PageTitleStackProps = {
  title?: ReactNode;
  description?: ReactNode;
  ouiaId?: string;
  className?: string;
};

/**
 * Shared title + description stack for LwPageHeader and LwPageHero.
 * Page-family internal — not exported from the assemblies barrel.
 * Spacing lives in `page-chrome-slots.css` (not PF utility classes).
 *
 * String title → `PageHeaderTitle`; string description → `Content` paragraph.
 * Non-string nodes render as-is (caller owns heading / copy structure).
 */
export function PageTitleStack({ title, description, ouiaId, className }: PageTitleStackProps) {
  return (
    <Flex
      direction={{ default: 'column' }}
      spaceItems={{ default: 'spaceItemsMd' }}
      className={className}
    >
      {title != null ? (
        typeof title === 'string' ? (
          <PageHeaderTitle size='2xl' title={title} />
        ) : (
          title
        )
      ) : null}
      {description != null ? (
        typeof description === 'string' ? (
          <Content component='p' ouiaId={ouiaId}>
            {description}
          </Content>
        ) : (
          description
        )
      ) : null}
    </Flex>
  );
}
