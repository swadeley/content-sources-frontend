import { SnapshotItem } from 'services/Content/ContentApi';

export type PublishRule = { reason: string; isDisabled: boolean };
export type Action = {
  label: string;
  dynamicLabel: string;
  isDisabled: boolean;
  tooltip?: string;
  navigate: () => void;
};

export const NO_PERMISSION = 'You do not have the required permissions to perform this action';
export const IN_PROGRESS_TASK = 'A task is in progress for this snapshot. Wait until it finishes';

export const isSnapshotEffectivelyPublished = (snapshot: SnapshotItem) => {
  if (snapshot.publish_task?.status === 'failed' || snapshot.publish_task?.status === 'canceled')
    return false;
  return !!snapshot.published;
};

export const hasInProgressTask = (snapshot: SnapshotItem) =>
  snapshot.publish_task?.status === 'pending' || snapshot.publish_task?.status === 'running';
