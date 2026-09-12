import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertVariant } from '@patternfly/react-core';
import useErrorNotification from 'Hooks/useErrorNotification';
import useNotification from 'Hooks/useNotification';
import {
  CONTENT_ITEM_KEY,
  CONTENT_LIST_KEY,
  LIST_SNAPSHOTS_KEY,
} from 'services/Content/ContentQueries';
import { publishSnapshot, toggleAsPartner } from './AdminPartnerReposApi';
import { ContentListResponse } from 'services/Content/ContentApi';

export type ToggleAsPartner = { uuid: string; partner: boolean };

export const useToggleAsPartnerMutate = () => {
  const queryClient = useQueryClient();
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();

  return useMutation({
    mutationFn: ({ uuid, partner }: ToggleAsPartner) => toggleAsPartner(uuid, partner),
    onSuccess: (_data, { uuid }) => {
      notify({
        variant: AlertVariant.success,
        title: 'Repository marked as partner',
      });

      // Avoiding flicker after isPending flips false and queryClient invalidation
      queryClient.setQueriesData<ContentListResponse>(
        { queryKey: [CONTENT_LIST_KEY] },
        (current) => {
          if (!current?.data) return current;
          return {
            ...current,
            data: current.data.map((repo) =>
              repo.uuid === uuid ? { ...repo, partner: true } : repo,
            ),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
    },
    onError: (err) => {
      errorNotifier(
        'Error marking repository as partner',
        'An error occurred',
        err,
        'toggle-as-partner-error',
      );
    },
  });
};

export type PublishSnapshotParams = {
  repoUUID: string;
  snapshotUUID: string;
  published: boolean;
};

export const usePublishSnapshotMutate = () => {
  const queryClient = useQueryClient();
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();

  return useMutation({
    mutationFn: ({ repoUUID, snapshotUUID, published }: PublishSnapshotParams) =>
      publishSnapshot(repoUUID, snapshotUUID, published),
    onSuccess: (_data, { published }) => {
      const action = published ? 'publishing' : 'unpublishing';
      notify({
        variant: AlertVariant.success,
        title: `Snapshot ${action} has started successfully`,
      });

      queryClient.invalidateQueries({ queryKey: [LIST_SNAPSHOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTENT_ITEM_KEY] });
    },
    onError: (err, { published }) => {
      const action = published ? 'publishing' : 'unpublishing';
      errorNotifier(`Error ${action} snapshot`, 'An error occurred', err, 'publish-snapshot-error');
    },
  });
};
