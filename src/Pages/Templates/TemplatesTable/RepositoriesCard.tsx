import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Divider,
  Flex,
  FlexItem,
  Skeleton,
} from '@patternfly/react-core';
import { RedhatIcon, DatabaseIcon, RhUiFoldersFillIcon } from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useCountEachRepositoryType } from 'Hooks/useCountEachRepositoryType';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';
import { t_global_font_size_400, t_global_icon_size_lg } from '@patternfly/react-tokens';
import { DestinationKey } from 'Hooks/navigation/navigationPaths';
import { ComponentClass, createElement } from 'react';
import { SVGIconProps } from '@patternfly/react-icons/dist/js/createIcon';

const RepositoriesCardHeader = () => (
  <>
    <CardTitle style={{ fontSize: t_global_font_size_400.var }}>Available repositories</CardTitle>
    <CardBody style={{ paddingBlockEnd: '0.7rem' }}>
      View, add, or upload repositories for template creation.
    </CardBody>
  </>
);

type RepositoryCountProps = {
  count: number;
  label: string;
  type: 'redHat' | 'partner' | 'custom';
};

const repositoryTypes: Record<
  RepositoryCountProps['type'],
  { target: DestinationKey; icon: ComponentClass<SVGIconProps> }
> = {
  redHat: { target: 'redHatRepositories', icon: RedhatIcon },
  partner: {
    target: 'partnerRepositories',
    icon: RhUiFoldersFillIcon,
  },
  custom: {
    target: 'customRepositories',
    icon: DatabaseIcon,
  },
};

const RepositoryCount = ({ count, label, type }: RepositoryCountProps) => {
  const repoType = repositoryTypes[type];
  const redirect = useNavigateTo(repoType.target);

  const iconStyle = {
    width: t_global_icon_size_lg.var,
    height: t_global_icon_size_lg.var,
    verticalAlign: 'middle',
  };
  const icon = createElement(repoType.icon, { style: iconStyle });

  return (
    <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'nowrap' }}>
      <FlexItem>{icon}</FlexItem>
      <FlexItem>
        <Button variant='link' isInline onClick={redirect}>
          <Flex gap={{ default: 'gapSm' }} flexWrap={{ default: 'nowrap' }}>
            <b>{`${count}`}</b>
            <span>{`${label}`}</span>
          </Flex>
        </Button>
      </FlexItem>
    </Flex>
  );
};

const RepositoriesCard = () => {
  const redirect = useNavigateTo('allRepositories');
  const { redhatCount, partnerCount, customCount, isLoading } = useCountEachRepositoryType();

  if (isLoading) {
    return (
      <Card className={spacing.mxLg} style={{ marginBottom: '1.5rem' }} isCompact>
        <RepositoriesCardHeader />
        <CardBody>
          <Flex alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem>
              <Skeleton
                width='10rem'
                screenreaderText='Loading Red Hat Repositories count'
                role='progressbar'
              />
            </FlexItem>
            <Divider orientation={{ default: 'horizontal', md: 'vertical' }} />
            <FlexItem>
              <Skeleton
                width='10rem'
                screenreaderText='Loading Partner Repositories count'
                role='progressbar'
              />
            </FlexItem>
            <Divider orientation={{ default: 'horizontal', md: 'vertical' }} />
            <FlexItem>
              <Skeleton
                width='10rem'
                screenreaderText='Loading Custom Repositories count'
                role='progressbar'
              />
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={spacing.mxLg} style={{ marginBottom: '1.5rem' }} isCompact>
      <RepositoriesCardHeader />
      <CardBody style={{ paddingBlockEnd: '0.7rem' }}>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          flexWrap={{ default: 'wrap' }}
        >
          <Flex alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem>
              <RepositoryCount count={redhatCount} label='Red Hat repositories' type='redHat' />
            </FlexItem>
            <Divider orientation={{ default: 'horizontal', md: 'vertical' }} />
            <FlexItem>
              <RepositoryCount count={partnerCount} label='Partner repositories' type='partner' />
            </FlexItem>
            <Divider orientation={{ default: 'horizontal', md: 'vertical' }} />
            <FlexItem>
              <RepositoryCount count={customCount} label='Custom repositories' type='custom' />
            </FlexItem>
          </Flex>
          <FlexItem>
            <Button variant='secondary' onClick={redirect}>
              Manage repositories
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export { RepositoriesCard };
