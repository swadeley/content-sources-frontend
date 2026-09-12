import { DELETE_ROUTE } from 'Routes/constants';
import { SnapshotItem } from 'services/Content/ContentApi';
import {
  hasInProgressTask,
  IN_PROGRESS_TASK,
  isSnapshotEffectivelyPublished,
  NO_PERMISSION,
  PublishRule,
} from './sharedActionChecks';

const NONE_SELECTED = 'Select one or more snapshots to delete';

const LAST_SNAPSHOT = 'Not allowed. At least one snapshot has to exist';
const PUBLISHED_SNAPSHOT = "You can't delete a published snapshot";

const getDeleteRuleOnSnapshot = (selectedSnapshot: SnapshotItem) => {
  if (isSnapshotEffectivelyPublished(selectedSnapshot))
    return { isDisabled: true, reason: 'already-published' };
  if (hasInProgressTask(selectedSnapshot)) return { isDisabled: true, reason: 'task-in-progress' };
  return { isDisabled: false, reason: 'passed-all-checks' };
};

export const getDeleteRuleOnSnapshots = (
  selectedSnapshots: SnapshotItem[],
  canModify: boolean,
  totalCount: number,
): PublishRule => {
  if (!canModify) return { isDisabled: true, reason: 'no-permission' };
  if (selectedSnapshots.length === 0) return { isDisabled: true, reason: 'none-selected' };
  if (selectedSnapshots.length === totalCount) return { isDisabled: true, reason: 'last-snapshot' };

  const actionChecks = selectedSnapshots.reduce((acc, current) => {
    const action = getDeleteRuleOnSnapshot(current);
    return [...acc, action];
  }, [] as PublishRule[]);

  if (actionChecks.some((check) => check.isDisabled))
    // return the first non-passing rule, there will always be at least one here
    return actionChecks.find((check) => check.isDisabled) as PublishRule;

  return { isDisabled: false, reason: 'passed-all-checks' };
};

const getDeleteTooltip = (reason: string): string => {
  switch (reason) {
    case 'no-permission':
      return NO_PERMISSION;
    case 'none-selected':
      return NONE_SELECTED;
    case 'last-snapshot':
      return LAST_SNAPSHOT;
    case 'already-published':
      return PUBLISHED_SNAPSHOT;
    case 'task-in-progress':
      return IN_PROGRESS_TASK;
    case 'passed-all-checks':
    default:
      return '';
  }
};

const getDeleteNavigate = (snapshots) => {
  if (snapshots.length === 0) return undefined;
  if (snapshots.length === 1) return `${DELETE_ROUTE}?snapshotUUID=${snapshots[0].uuid}`;
  return DELETE_ROUTE;
};

export const getDynamicDeleteLabel = (reason, count) => {
  switch (reason) {
    case 'last-snapshot':
      return count === 1 ? "Can't delete the last snapshot" : "Can't delete all snapshots";
    case 'passed-all-checks':
      return `Delete ${count} ${count === 1 ? 'snapshot' : 'snapshots'}`;
    default:
      return 'Delete selected snapshots';
  }
};

const createDeleteAction = (rule, tooltip, navigate) => ({
  isDisabled: rule.isDisabled,
  tooltip,
  rule: rule.reason,
  navigate,
  labelBasic: 'Delete',
});

export function getDeleteAction(
  snapshotsList: SnapshotItem[],
  selectedRows: {
    id: string;
  }[],
  canModify: boolean,
  totalCount: number,
) {
  const selectedSnapshots = snapshotsList.filter((snapshot) =>
    selectedRows.find((row) => row.id === snapshot.uuid),
  );
  const rule = getDeleteRuleOnSnapshots(selectedSnapshots, canModify, totalCount);
  const tooltip = getDeleteTooltip(rule.reason);
  const navigate = getDeleteNavigate(selectedSnapshots);
  const action = createDeleteAction(rule, tooltip, navigate);

  return action;
}
