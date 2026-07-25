import { Content, Flex, FlexItem } from '@patternfly/react-core';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { ReactNode } from 'react';

type LightwellPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  ouiaId?: string;
};

const LightwellPageHeader = ({ title, description, actions, ouiaId }: LightwellPageHeaderProps) => (
  <Flex
    justifyContent={{ default: 'justifyContentSpaceBetween' }}
    alignItems={{ default: 'alignItemsFlexStart' }}
    className={`${spacing.pxLg} ${spacing.pyMd}`}
  >
    <FlexItem>
      <Flex className={`${spacing.mXs} ${spacing.pbSm}`} direction={{ default: 'column' }}>
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

export default LightwellPageHeader;
