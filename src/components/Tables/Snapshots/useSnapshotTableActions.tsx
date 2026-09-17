import { useCallback, useMemo } from 'react';
import { ActionsColumn, IAction } from '@patternfly/react-table';
import { SnapshotItem } from 'services/Content/ContentApi';
import { getDeleteAction, getDynamicDeleteLabel } from 'Hooks/snapshotActions/getDeleteAction';
import { isSnapshotEffectivelyPublished } from 'Hooks/snapshotActions/sharedActionChecks';
import { getDynamicPublishLabel, getPublishAction } from 'Hooks/snapshotActions/getPublishAction';

export const useSnapshotTableActions = ({
  snapshotsList,
  selectedRows,
  canModify,
  canPublish,
  navigate,
  count,
  isRepositoryReadOnly,
}) => {
  const publishActionPrimaryButton = useMemo(() => {
    const publishAction = getPublishAction(snapshotsList, selectedRows, canModify, canPublish);
    const dynamicLabel = getDynamicPublishLabel(publishAction.rule);
    return {
      dynamicLabel,
      label: publishAction.labelBasic,
      isDisabled: publishAction.isDisabled,
      navigate: () => navigate(publishAction.navigate),
      tooltip: publishAction.tooltip,
    };
  }, [snapshotsList, selectedRows, canModify, canPublish]);

  const deleteActionPrimaryButton = useMemo(() => {
    const deleteAction = getDeleteAction(snapshotsList, selectedRows, canModify, count);
    const dynamicLabel = getDynamicDeleteLabel(deleteAction.rule, selectedRows.length);
    return {
      dynamicLabel,
      label: deleteAction.labelBasic,
      isDisabled: deleteAction.isDisabled,
      navigate: () => navigate(deleteAction.navigate),
      tooltip: deleteAction.tooltip,
    };
  }, [snapshotsList, selectedRows, canModify, count]);

  const rowActions = useCallback(
    (snapshot: SnapshotItem): IAction[] => {
      if (isRepositoryReadOnly) return [];

      const isPublished = isSnapshotEffectivelyPublished(snapshot);

      const publishActionBase = getPublishAction(
        [snapshot],
        [{ id: snapshot.uuid }],
        canModify,
        canPublish,
      );

      const deleteActionBase = getDeleteAction(
        [snapshot],
        [{ id: snapshot.uuid }],
        canModify,
        count,
      );

      const deleteAction: IAction = {
        isAriaDisabled: deleteActionBase.isDisabled,
        tooltipProps: deleteActionBase.tooltip ? { content: deleteActionBase.tooltip } : undefined,
        title: deleteActionBase.labelBasic,
        onClick: () => navigate(deleteActionBase.navigate),
      };

      const publishAction: IAction = {
        isAriaDisabled: publishActionBase.isDisabled,
        tooltipProps: publishActionBase.tooltip
          ? { content: publishActionBase.tooltip }
          : undefined,
        title: publishActionBase.labelBasic,
        onClick: () => navigate(publishActionBase.navigate),
      };

      return canPublish
        ? isPublished
          ? [
              deleteAction,
              // unpublishAction - TODO: put unpublish action here later
            ]
          : [deleteAction, publishAction]
        : [deleteAction];
    },
    [isRepositoryReadOnly, count, navigate, canPublish, canModify],
  );

  const kebab = useCallback(
    (snapshot: SnapshotItem) => {
      if (isRepositoryReadOnly) return [];
      return [
        {
          cell: <ActionsColumn items={rowActions(snapshot)} />,
          props: { isActionCell: true },
        },
      ];
    },
    [isRepositoryReadOnly, rowActions],
  );

  return { publishActionPrimaryButton, deleteActionPrimaryButton, kebab };
};
