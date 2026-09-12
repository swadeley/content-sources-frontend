import { useAppContext } from 'middleware/AppContext';
import { useCallback, useEffect } from 'react';
import { ContentOrigin, SnapshotItem } from 'services/Content/ContentApi';
import { useFetchContent } from 'services/Content/ContentQueries';

export const useRepositoryType = (repoUUID: string) => {
  const { features, rbac } = useAppContext();
  const { data: repository, isError } = useFetchContent(repoUUID);

  const isRepositoryReadOnly =
    repository?.origin === ContentOrigin.REDHAT || repository?.origin === ContentOrigin.COMMUNITY;
  const canModify = !isRepositoryReadOnly && !!rbac?.repoWrite;

  const isPartnerRepo = !!repository?.partner;
  const canPublish =
    isPartnerRepo &&
    !!features?.adminpartnerrepositories?.enabled &&
    !!features?.adminpartnerrepositories?.accessible;

  return {
    repositoryName: repository?.name,
    repository,
    isRepositoryReadOnly,
    canModify,
    isPartnerRepo,
    canPublish,
    isError,
  };
};

export const useRepositoryPublishSnapshotPolling = ({ repositoryList, setPublishPolling }) => {
  // Derive publish polling from repository server data — any repo with an in-progress publish task triggers polling
  useEffect(() => {
    const hasPublishing = repositoryList?.data?.some(
      (item) =>
        item.snapshot_publish_state?.publishing || item.snapshot_publish_state?.unpublishing,
    );
    setPublishPolling(!!hasPublishing);
  }, [repositoryList?.data]);
};

export const usePublishSnapshotPolling = (snapshotsList, setIsPublishPolling) => {
  // Derive polling state from snapshot data: any snapshot with an in-progress publish task
  useEffect(() => {
    const hasInProgress = snapshotsList.some(
      (s) => s.publish_task?.status === 'pending' || s.publish_task?.status === 'running',
    );
    setIsPublishPolling(hasInProgress);
  }, [snapshotsList]);
};

export const usePublishedSnapshotState = () => {
  const getSnapshotPublishState = useCallback(
    (snapshot: SnapshotItem | undefined): 'published' | 'publishing' | 'unpublishing' | 'none' => {
      if (!snapshot) return 'none';
      const taskStatus = snapshot.publish_task?.status;
      if (taskStatus === 'pending' || taskStatus === 'running') {
        return snapshot.published ? 'publishing' : 'unpublishing';
      }
      if (snapshot.published && taskStatus === 'completed') return 'published';
      return 'none';
    },
    [],
  );

  return { getSnapshotPublishState };
};
