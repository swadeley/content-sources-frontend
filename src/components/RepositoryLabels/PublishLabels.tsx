import { SnapshotPublishState } from 'services/AdminPartnerRepos/AdminPartnerReposApi';
import PublishedLabel from './PublishedLabel';
import PublishingInProgressLabel from './PublishingInProgressLabel';
import UnpublishingInProgressLabel from './UnpublishingInProgressLabel';

export const PublishLabels = ({
  publishState,
}: {
  publishState: string | SnapshotPublishState | undefined;
}) => {
  if (typeof publishState === 'string')
    return (
      <>
        {publishState === 'published' && <PublishedLabel />}
        {publishState === 'publishing' && <PublishingInProgressLabel />}
        {publishState === 'unpublishing' && <UnpublishingInProgressLabel />}
      </>
    );
  else if (typeof publishState === 'object' || undefined) {
    return (
      <>
        {publishState?.published && <PublishedLabel />}
        {publishState?.publishing && <PublishingInProgressLabel />}
        {publishState?.unpublishing && <UnpublishingInProgressLabel />}
      </>
    );
  }
};
