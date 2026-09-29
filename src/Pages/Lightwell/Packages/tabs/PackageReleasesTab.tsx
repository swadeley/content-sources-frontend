import { Flex, Label, Title } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useMemo } from 'react';

import { RepositoryPackageReleaseInfo } from '../../../../services/Content/ContentApi';
import CopyLabel from '../components/CopyLabel';
import LightwellEmptyState from '../../components/LightwellEmptyState';
import type { PackageCoordinate } from '../types';
import { formatReleaseCopyText, formatReleaseDate } from '../utils/format';
import { lightwellReleaseNum, toLightwellRelease } from '../utils/versions';

type PackageReleasesTabProps = {
  version: string;
  builds: RepositoryPackageReleaseInfo[];
  packageCoordinate: PackageCoordinate;
};

const PackageReleasesTab = ({ version, builds, packageCoordinate }: PackageReleasesTabProps) => {
  const releases = useMemo(
    () =>
      [...builds]
        .filter((build) => !!build.release)
        .sort((a, b) => lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release)),
    [builds],
  );

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <Title headingLevel='h2' size='xl'>
        Releases for: version {version}
      </Title>
      {releases.length === 0 ? (
        <LightwellEmptyState
          variant='empty'
          titleText='No releases for this version'
          bodyText='Lightwell has not published a release for this version yet. Select a different version to see its releases.'
        />
      ) : (
        <Table aria-label={`Releases for ${version}`} isStriped>
          <Thead>
            <Tr>
              <Th>Release</Th>
              <Th width={15}>Date released</Th>
            </Tr>
          </Thead>
          <Tbody>
            {releases.map((build, index) => {
              const fullVersion = toLightwellRelease(build);

              return (
                <Tr key={fullVersion}>
                  <Td dataLabel='Release'>
                    <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <CopyLabel copyText={formatReleaseCopyText(packageCoordinate, fullVersion)}>
                        {fullVersion}
                      </CopyLabel>
                      {index === 0 ? (
                        <Label isCompact color='blue'>
                          Latest
                        </Label>
                      ) : null}
                    </Flex>
                  </Td>
                  <Td dataLabel='Date released'>{formatReleaseDate(build.created_at)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </Flex>
  );
};

export default PackageReleasesTab;
