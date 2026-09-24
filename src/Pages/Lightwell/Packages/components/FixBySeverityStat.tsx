import { Content, Flex, Icon, Title } from '@patternfly/react-core';
import {
  SeverityCriticalIcon,
  SeverityImportantIcon,
  SeverityMinorIcon,
  SeverityModerateIcon,
  SeverityNoneIcon,
} from '@patternfly/react-icons';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import type { ReactNode } from 'react';

import type { AdvisorySeverityCounts } from '../hooks/useLatestReleaseFixes';
import type { AdvisorySeverity } from '../utils/severity';

const SEVERITY_ICONS: Record<AdvisorySeverity, ReactNode> = {
  Critical: <SeverityCriticalIcon />,
  Important: <SeverityImportantIcon />,
  Moderate: <SeverityModerateIcon />,
  Low: <SeverityMinorIcon />,
  None: <SeverityNoneIcon />,
};

type FixBySeverityStatProps = {
  severity: AdvisorySeverity;
  counts: AdvisorySeverityCounts;
};

const FixBySeverityStat = ({ severity, counts }: FixBySeverityStatProps) => (
  <Flex
    direction={{ default: 'column' }}
    gap={{ default: 'gapXs' }}
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentCenter' }}
  >
    <Title headingLevel='h4' size='3xl' className={spacing.pxXl}>
      {counts[severity]}
    </Title>
    <Flex
      alignItems={{ default: 'alignItemsCenter' }}
      justifyContent={{ default: 'justifyContentCenter' }}
      gap={{ default: 'gapSm' }}
    >
      <Icon size='sm'>{SEVERITY_ICONS[severity]}</Icon>
      <Content>{severity}</Content>
    </Flex>
  </Flex>
);

export default FixBySeverityStat;
