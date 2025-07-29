import { Content, Flex } from '@patternfly/react-core';
import {
  OpenSourceBadge,
  PageHeader as _PageHeader,
  PageHeaderTitle,
} from '@redhat-cloud-services/frontend-components';
import { PageHeaderProps as _PageHeaderProps } from '@redhat-cloud-services/frontend-components/PageHeader/PageHeader';

import { FunctionComponent, ReactElement } from 'react';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

interface PageHeaderProps extends _PageHeaderProps {
  children?: ReactElement | Array<ReactElement>;
}

const PageHeader = _PageHeader as FunctionComponent<PageHeaderProps>;

interface Props {
  title: string;
  ouiaId: string;
  paragraph: string;
}

export default function Header({ title, ouiaId, paragraph }: Props) {
  return (
    <PageHeader>
      <Flex className={`${spacing.mXs} ${spacing.pbSm}`} direction={{ default: 'column' }}>
        <PageHeaderTitle
          title={
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              columnGap={{ default: 'columnGapNone' }}
            >
              <span>{title}</span>
              <OpenSourceBadge repositoriesURL='https://github.com/content-services/content-sources-frontend' />
            </Flex>
          }
        />
        <Content component='p' ouiaId={ouiaId}>
          {paragraph}
        </Content>
      </Flex>
    </PageHeader>
  );
}
