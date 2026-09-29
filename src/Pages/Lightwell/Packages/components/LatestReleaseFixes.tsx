import { Content, Flex, FlexItem, Icon, Title } from '@patternfly/react-core';
import { RhUiSecuredIcon } from '@patternfly/react-icons';

import FixBySeverityStat from './FixBySeverityStat';
import FixesCard from './FixesCard';
import type { AdvisorySeverityCounts } from '../hooks/useLatestReleaseFixes';
import type { AdvisorySeverity } from '../utils/severity';

const DISPLAYED_SEVERITIES: AdvisorySeverity[] = ['Critical', 'Important', 'Moderate'];

type LatestReleaseFixesProps = {
  total: number;
  counts: AdvisorySeverityCounts;
};

const releaseFixesDescription = (total: number, counts: AdvisorySeverityCounts) => {
  if (total === 0 || counts.None === total) {
    return 'Released to support a dependency update with no new fixes included.';
  }

  if (counts.Low > 0) {
    const vulnerability = counts.Low === 1 ? 'vulnerability' : 'vulnerabilities';
    return (
      <>
        Addresses key security issues, including <strong>{counts.Low} low-severity</strong>{' '}
        {vulnerability}.
      </>
    );
  }

  return undefined;
};

const LatestReleaseFixes = ({ total, counts }: LatestReleaseFixesProps) => {
  const fixesTotal = total - counts.None;
  const description = releaseFixesDescription(total, counts);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <FlexItem>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          gap={{ default: 'gapSm' }}
          height='fit-content'
        >
          {fixesTotal > 0 ? (
            <Icon size='xl' status='success'>
              <RhUiSecuredIcon />
            </Icon>
          ) : null}
          <Title headingLevel='h3' size='lg'>
            {fixesTotal > 0
              ? `${fixesTotal} new backported fixes in this release`
              : 'No new backported fixes in this release'}
          </Title>
        </Flex>
      </FlexItem>

      <FixesCard>
        {DISPLAYED_SEVERITIES.map((severity) => (
          <FixBySeverityStat key={severity} severity={severity} counts={counts} />
        ))}
      </FixesCard>

      {description ? (
        <FlexItem>
          <Content component='p'>{description}</Content>
        </FlexItem>
      ) : null}
    </Flex>
  );
};

export default LatestReleaseFixes;
