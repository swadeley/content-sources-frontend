import { Content, Flex, FlexItem, Icon, Title } from '@patternfly/react-core';
import { RhUiSecuredIcon } from '@patternfly/react-icons';

import FixBySeverityStat from './FixBySeverityStat';
import FixesCard from './FixesCard';
import type { AdvisorySeverityCounts } from '../hooks/useLatestReleaseFixes';
import { ADVISORY_SEVERITIES } from '../utils/severity';

type LatestReleaseFixesProps = {
  total: number;
  counts: AdvisorySeverityCounts;
};

const releaseFixesDescription = (total: number, counts: AdvisorySeverityCounts) => {
  if (total === 0) {
    return 'Issued to support a dependency update.';
  }

  const hasNonLowFix = counts.Critical > 0 || counts.Important > 0 || counts.Moderate > 0;

  if (!hasNonLowFix && counts.Low > 0) {
    return 'Resolves remaining low-severity issues from earlier release cycles.';
  }

  return undefined;
};

const LatestReleaseFixes = ({ total, counts }: LatestReleaseFixesProps) => {
  const description = releaseFixesDescription(total, counts);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <FlexItem>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          gap={{ default: 'gapSm' }}
          height='fit-content'
        >
          {total > 0 ? (
            <Icon size='xl' status='success'>
              <RhUiSecuredIcon />
            </Icon>
          ) : null}
          <Title headingLevel='h3' size='lg'>
            {total > 0
              ? `${total} new backported fixes in this release`
              : 'No new backported fixes in this release'}
          </Title>
        </Flex>
      </FlexItem>

      {total > 0 ? (
        <FixesCard>
          {ADVISORY_SEVERITIES.map((severity) => (
            <FixBySeverityStat key={severity} severity={severity} counts={counts} />
          ))}
        </FixesCard>
      ) : null}

      {description ? (
        <FlexItem>
          <Content component='p'>{description}</Content>
        </FlexItem>
      ) : null}
    </Flex>
  );
};

export default LatestReleaseFixes;
