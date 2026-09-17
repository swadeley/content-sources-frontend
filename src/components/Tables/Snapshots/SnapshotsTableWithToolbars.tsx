import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { Button, Flex, Pagination, ToolbarItem, ToolbarItemVariant } from '@patternfly/react-core';

import { ThProps } from '@patternfly/react-table';
import { SkeletonTableBody } from '@patternfly/react-component-groups';

import {
  DataViewTable,
  DataViewTh,
  DataViewTrObject,
} from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import {
  useDataViewSelection,
  useDataViewSort,
} from '@patternfly/react-data-view/dist/dynamic/Hooks';
import {
  BulkSelect,
  BulkSelectValue,
} from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';

import EmptyTableDataView from 'components/EmptyTableDataView/EmptyTableDataView';

import ChangedArrows from 'Pages/Repositories/ContentListTable/components/SnapshotListModal/components/ChangedArrows';
import RepoConfig from 'Pages/Repositories/ContentListTable/components/SnapshotListModal/components/RepoConfig';
import { SnapshotDetailTab } from 'Pages/Repositories/ContentListTable/components/SnapshotDetailsModal/SnapshotDetailsModal';

import { PaginationLocalStorage } from 'Hooks/tables/usePaginationLocalStorage';
import useTableActiveState from 'Hooks/tables/useTableActiveState';
import useRootPath from 'Hooks/useRootPath';

import { SnapshotItem } from 'services/Content/ContentApi';

import { formatDateDDMMMYYYY } from 'helpers';
import { REPOSITORIES_ROUTE } from 'Routes/constants';
import { SNAPSHOTS_TABLE_COLUMNS } from './constants';
import { SnapshotsPrimaryActionButton } from './SnapshotsPrimaryActionButton';
import { usePublishedSnapshotState } from 'Hooks/snapshotActions/usePublishSnapshot';
import { PublishLabels } from 'components/RepositoryLabels/PublishLabels';
import { useSnapshotTableActions } from './useSnapshotTableActions';

interface SnapshotsTableProps {
  isLoading: boolean;
  canModify: boolean;
  count: number;
  repoUUID: string;
  snapshotsList: SnapshotItem[];
  paginationData: PaginationLocalStorage;
  isRepositoryReadOnly: boolean;
  canPublish: boolean;
  selection: ReturnType<typeof useDataViewSelection>;
  sortProps: ReturnType<typeof useDataViewSort>;
}

const SnapshotsTableWithToolbars = ({
  snapshotsList,
  paginationData,
  isLoading,
  count,
  isRepositoryReadOnly,
  canPublish,
  repoUUID,
  selection,
  sortProps,
  canModify,
}: SnapshotsTableProps) => {
  const navigate = useNavigate();
  const rootPath = useRootPath();

  const { selected: selectedRows, onSelect, isSelected } = selection;
  const { sortBy, direction, onSort } = sortProps;
  const paginationProps = {
    ...paginationData,
    itemCount: count,
  };

  const isLoadingOrZeroCount = isLoading || !count;

  const activeState = useTableActiveState({ isLoading, count });
  const shouldEnableBulkSelection = canModify && activeState === undefined;

  const activeSortIndex = sortBy
    ? SNAPSHOTS_TABLE_COLUMNS.findIndex((col) => col.name === sortBy)
    : -1;

  const getSortParams = (columnIndex: number): ThProps['sort'] | undefined => {
    const col = SNAPSHOTS_TABLE_COLUMNS[columnIndex];
    if (!col.sortAttribute) return undefined;
    return {
      sortBy: {
        index: activeSortIndex,
        direction: direction,
        defaultDirection: 'desc',
      },
      onSort: (_event, _index, dir) => onSort(_event, col.name, dir),
      columnIndex,
    };
  };

  const ouiaId = 'snapshot_list_table';

  const dataViewColumns: DataViewTh[] = SNAPSHOTS_TABLE_COLUMNS.map((col, index) => ({
    cell: col.name,
    props: col.sortAttribute ? { sort: getSortParams(index) } : {},
  }));

  const { getSnapshotPublishState } = usePublishedSnapshotState();
  const { publishActionPrimaryButton, deleteActionPrimaryButton, kebab } = useSnapshotTableActions({
    snapshotsList,
    selectedRows,
    canModify,
    canPublish,
    navigate,
    count,
    isRepositoryReadOnly,
  });

  const dataViewRows: DataViewTrObject[] = useMemo(
    () =>
      snapshotsList.map((snapshot) => {
        const {
          uuid: snapUuid,
          created_at,
          content_counts,
          added_counts,
          removed_counts,
        } = snapshot;
        const publishState = getSnapshotPublishState(snapshot);

        return {
          id: snapUuid,
          row: [
            {
              cell: (
                <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <Button
                    variant='link'
                    isInline
                    onClick={() =>
                      navigate(
                        `${rootPath}/${REPOSITORIES_ROUTE}/${repoUUID}/snapshots/${snapUuid}`,
                      )
                    }
                  >
                    {formatDateDDMMMYYYY(created_at, true)}
                  </Button>
                  {canPublish && <PublishLabels publishState={publishState} />}
                </Flex>
              ),
            },
            {
              cell: (
                <ChangedArrows
                  addedCount={added_counts?.['rpm.package'] || 0}
                  removedCount={removed_counts?.['rpm.package'] || 0}
                />
              ),
            },
            {
              cell: (
                <Button
                  variant='link'
                  ouiaId='snapshot_package_count_button'
                  isInline
                  isDisabled={!content_counts?.['rpm.package']}
                  onClick={() =>
                    navigate(`${rootPath}/${REPOSITORIES_ROUTE}/${repoUUID}/snapshots/${snapUuid}`)
                  }
                >
                  {content_counts?.['rpm.package'] || 0}
                </Button>
              ),
            },
            {
              cell: (
                <Button
                  variant='link'
                  ouiaId='snapshot_advisory_count_button'
                  isInline
                  isDisabled={!content_counts?.['rpm.advisory']}
                  onClick={() =>
                    navigate(
                      `${rootPath}/${REPOSITORIES_ROUTE}/${repoUUID}/snapshots/${snapUuid}?tab=${SnapshotDetailTab.ERRATA}`,
                    )
                  }
                >
                  {content_counts?.['rpm.advisory'] || 0}
                </Button>
              ),
            },
            {
              cell: <RepoConfig repoUUID={repoUUID} snapUUID={snapUuid} latest={false} />,
            },
            ...kebab(snapshot),
          ],
        };
      }),
    [snapshotsList, repoUUID, rootPath, navigate, kebab, getSnapshotPublishState, canPublish],
  );

  // bulk select action
  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(false);
      onSelect(true, dataViewRows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, dataViewRows);
    }
  };

  const pageSelectionCount = dataViewRows.filter(isSelected).length;
  const isPageSelected = dataViewRows.length > 0 && pageSelectionCount === dataViewRows.length;
  const isPagePartiallySelected = pageSelectionCount > 0 && !isPageSelected;

  const bulkSelect = (
    <BulkSelect
      isDataPaginated
      onSelect={handleBulkSelect}
      selectedCount={selectedRows.length}
      pageCount={dataViewRows.length}
      pageSelected={isPageSelected}
      pagePartiallySelected={isPagePartiallySelected}
      menuToggleCheckboxProps={{
        id: 'bulk-select-snapshots-checkbox',
        isDisabled: isLoadingOrZeroCount,
      }}
    />
  );

  const actionsDropdown = (
    <SnapshotsPrimaryActionButton
      isFetchingOrLoading={isLoading}
      actions={{
        deleteAction: deleteActionPrimaryButton,
        publishAction: publishActionPrimaryButton,
      }}
      canPublish={canPublish}
    />
  );

  const bulkActionProps = shouldEnableBulkSelection
    ? { bulkSelect, actions: actionsDropdown }
    : isRepositoryReadOnly
      ? {}
      : { actions: actionsDropdown };

  // pagination
  const topPagination = (
    <Pagination
      id='top-pagination-id'
      widgetId='topPaginationWidgetId'
      {...paginationProps}
      isCompact
      isDisabled={isLoading}
    />
  );

  const bottomPagination = (
    <Pagination
      id='bottom-pagination-id'
      widgetId='bottomPaginationWidgetId'
      {...paginationProps}
      variant='bottom'
    />
  );

  // table states
  const emptyStateTable = (
    <EmptyTableDataView
      ouiaId={ouiaId}
      variant='zero'
      itemName='snapshots'
      zeroBody='No snapshots have been taken for this repository yet.'
      colSpan={SNAPSHOTS_TABLE_COLUMNS.length}
    />
  );

  const loadingStateTable = (
    <SkeletonTableBody
      rowsCount={paginationProps.perPage}
      columnsCount={SNAPSHOTS_TABLE_COLUMNS.length}
    />
  );

  return (
    <DataView
      data-ouia-component-id={ouiaId}
      activeState={activeState}
      {...(shouldEnableBulkSelection ? { selection } : {})}
    >
      <DataViewToolbar className={spacing.pSm} {...bulkActionProps}>
        <ToolbarItem variant={ToolbarItemVariant.pagination} align={{ default: 'alignEnd' }}>
          {topPagination}
        </ToolbarItem>
      </DataViewToolbar>
      <DataViewTable
        aria-label='Snapshots list table'
        ouiaId={ouiaId}
        variant='compact'
        columns={dataViewColumns}
        rows={dataViewRows}
        bodyStates={{ empty: emptyStateTable, loading: loadingStateTable }}
      />
      <DataViewToolbar pagination={bottomPagination} />
    </DataView>
  );
};

export default SnapshotsTableWithToolbars;
