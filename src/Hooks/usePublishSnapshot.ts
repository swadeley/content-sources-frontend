import { ContentOrigin } from 'services/Content/ContentApi';
import { useFetchContent } from 'services/Content/ContentQueries';

export const useIsSnapshotType = (repoUUID: string) => {
  const { data: repository, isError } = useFetchContent(repoUUID);
  const isSnapshotsReadOnly =
    repository?.origin === ContentOrigin.REDHAT || repository?.origin === ContentOrigin.COMMUNITY;
  return { isSnapshotsReadOnly, repositoryName: repository?.name, isError };
};
