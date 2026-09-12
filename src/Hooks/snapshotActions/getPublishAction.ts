import { PUBLISH_ROUTE } from 'Routes/constants';
import { SnapshotItem } from 'services/Content/ContentApi';
import {
  hasInProgressTask,
  IN_PROGRESS_TASK,
  isSnapshotEffectivelyPublished,
  NO_PERMISSION,
  PublishRule,
} from './sharedActionChecks';

const NOT_PARTNER_ADMIN = 'This is not a partner repository or you do not have admin rights';
const NONE_SELECTED = 'Select exactly one snapshot to publish';
const ONE_SNAPSHOT_ONLY = 'Can publish only one snapshot at a time';
const ALREADY_PUBLISHED = 'Unselect already published snapshot(s)';
const ZERO_PACKAGES = 'Cannot publish snapshot with 0 packages';

const hasZeroPackages = (snapshot: SnapshotItem) =>
  (snapshot.content_counts?.['rpm.package'] || 0) === 0;

const getPublishRuleOnSnapshot = (selectedSnapshot: SnapshotItem) => {
  if (isSnapshotEffectivelyPublished(selectedSnapshot))
    return { isDisabled: true, reason: 'already-published' };
  if (hasInProgressTask(selectedSnapshot)) return { isDisabled: true, reason: 'task-in-progress' };
  if (hasZeroPackages(selectedSnapshot)) return { isDisabled: true, reason: 'zero-packages' };
  return { isDisabled: false, reason: 'passed-all-checks' };
};

export const getPublishRuleOnSnapshots = (
  selectedSnapshots: SnapshotItem[],
  canModify: boolean,
  canPublish: boolean,
): PublishRule => {
  if (!canModify) return { isDisabled: true, reason: 'no-permission' };
  if (!canPublish) return { isDisabled: true, reason: 'not-partner-repo-or-admin' };
  if (selectedSnapshots.length === 0) return { isDisabled: true, reason: 'none-selected' };
  if (selectedSnapshots.length > 1) return { isDisabled: true, reason: 'multiple-selected' };

  const actionChecks = selectedSnapshots.reduce((acc, current) => {
    const action = getPublishRuleOnSnapshot(current);
    return [...acc, action];
  }, [] as PublishRule[]);

  if (actionChecks.some((check) => check.isDisabled))
    // return the first non-passing rule, there will always be at least one here
    return actionChecks.find((check) => check.isDisabled) as PublishRule;

  return { isDisabled: false, reason: 'passed-all-checks' };
};

const getPublishTooltip = (reason: string): string => {
  switch (reason) {
    case 'no-permission':
      return NO_PERMISSION;
    case 'not-partner-repo-or-admin':
      return NOT_PARTNER_ADMIN;
    case 'none-selected':
      return NONE_SELECTED;
    case 'multiple-selected':
      return ONE_SNAPSHOT_ONLY;
    case 'already-published':
      return ALREADY_PUBLISHED;
    case 'task-in-progress':
      return IN_PROGRESS_TASK;
    case 'zero-packages':
      return ZERO_PACKAGES;
    case 'passed-all-checks':
    default:
      return '';
  }
};

const getSingleSnapshotNavigate = (snapshots: SnapshotItem[]) => {
  if (snapshots.length === 0) return undefined;
  const route = `${PUBLISH_ROUTE}?snapshotUUID=${snapshots[0].uuid}`;
  return route;
};

const createPublishAction = (rule, tooltip, navigate) => ({
  isDisabled: rule.isDisabled,
  tooltip,
  rule: rule.reason,
  navigate,
  labelBasic: 'Publish',
});

export const getDynamicPublishLabel = (reason) => {
  switch (reason) {
    case 'multiple-selected':
      return 'More than 1 snapshot selected';
    case 'already-published':
      return 'Already published snapshot selected';
    case 'passed-all-checks':
    default:
      return 'Publish a snapshot';
  }
};

export function getPublishAction(
  snapshotsList: SnapshotItem[],
  selectedRows: {
    id: string;
  }[],
  canModify: boolean,
  canPublish: boolean,
) {
  const selectedSnapshots = snapshotsList.filter((snapshot) =>
    selectedRows.find((row) => row.id === snapshot.uuid),
  );
  const rule = getPublishRuleOnSnapshots(selectedSnapshots, canModify, canPublish);
  const tooltip = getPublishTooltip(rule.reason);
  const navigate = getSingleSnapshotNavigate(selectedSnapshots);
  const action = createPublishAction(rule, tooltip, navigate);

  return action;
}
