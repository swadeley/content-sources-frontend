import { Flex } from '@patternfly/react-core';

import MarkAsPartneredInProgressLabel from 'components/RepositoryLabels/MarkPartnerInProgressLabel';
import PartneredLabel from 'components/RepositoryLabels/PartneredLabel';
import PartnerRepositoryLabel from 'components/RepositoryLabels/PartnerRepositoryLabel';
import { PublishLabels } from 'components/RepositoryLabels/PublishLabels';
import UploadRepositoryLabel from 'components/RepositoryLabels/UploadRepositoryLabel';
import { SnapshotPublishState } from 'services/AdminPartnerRepos/AdminPartnerReposApi';

import { ContentOrigin } from 'services/Content/ContentApi';

type RepositoryLabelsProps = {
  origin: ContentOrigin | undefined;
  isRepoBeingMarkedAsPartner: boolean;
  isPartner: boolean | undefined;
  publishState?: SnapshotPublishState;
};

export const RepositoryLabels = ({
  origin,
  isRepoBeingMarkedAsPartner,
  isPartner,
  publishState,
}: RepositoryLabelsProps) => {
  // upload repositories
  if (origin === ContentOrigin.UPLOAD) {
    return (
      <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
        <UploadRepositoryLabel />
        {isRepoBeingMarkedAsPartner && <MarkAsPartneredInProgressLabel />}
        {isPartner && <PartneredLabel />}
        <PublishLabels publishState={publishState} />
      </Flex>
    );
  }

  // partner repositories - partner consumers
  if (origin === ContentOrigin.COMMUNITY) {
    return (
      <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
        <PartnerRepositoryLabel />
      </Flex>
    );
  }

  return null;
};
