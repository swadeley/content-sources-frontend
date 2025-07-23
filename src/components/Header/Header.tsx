import { Button, Content, Flex, Popover } from '@patternfly/react-core';
import { ExternalLinkAltIcon, HelpIcon } from '@patternfly/react-icons';
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

interface HeaderProps {
  title: string;
  ouiaId: string;
  paragraph: string;
  aboutData?: AboutProps;
}

interface AboutProps {
  text: string;
  docsURL: string;
  docsLabel: string;
  header: string;
}

const About = ({ header, text, docsURL, docsLabel }: AboutProps) => (
  <Popover
    headerContent={header}
    bodyContent={text}
    footerContent={
      <Button
        component='a'
        target='_blank'
        variant='link'
        icon={<ExternalLinkAltIcon />}
        iconPosition='right'
        isInline
        href={docsURL}
      >
        {docsLabel}
      </Button>
    }
  >
    <Button
      icon={<HelpIcon />}
      variant='plain'
      aria-label={header}
      className={spacing.mlSm}
      style={{ verticalAlign: '2px' }}
    />
  </Popover>
);

export default function Header({ title, ouiaId, paragraph, aboutData }: HeaderProps) {
  return (
    <PageHeader>
      <Flex className={`${spacing.mXs} ${spacing.pbSm}`} direction={{ default: 'column' }}>
        <PageHeaderTitle
          title={
            <>
              {title}
              {aboutData && <About {...aboutData} />}
              <span style={{ verticalAlign: '2px' }}>
                <OpenSourceBadge repositoriesURL='https://github.com/content-services/content-sources-frontend' />
              </span>
            </>
          }
        />
        <Content component='p' ouiaId={ouiaId}>
          {paragraph}
        </Content>
      </Flex>
    </PageHeader>
  );
}
