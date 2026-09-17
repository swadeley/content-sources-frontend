import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { Button, Pagination, ToolbarItem, ToolbarItemVariant } from '@patternfly/react-core';

import { ActionsColumn, IAction, ThProps } from '@patternfly/react-table';
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
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';

import ChangedArrows from 'Pages/Repositories/ContentListTable/components/SnapshotListModal/components/ChangedArrows';
import RepoConfig from 'Pages/Repositories/ContentListTable/components/SnapshotListModal/components/RepoConfig';
import { SnapshotDetailTab } from 'Pages/Repositories/ContentListTable/components/SnapshotDetailsModal/SnapshotDetailsModal';

import { PaginationLocalStorage } from 'Hooks/tables/usePaginationLocalStorage';
import useTableActiveState from 'Hooks/tables/useTableActiveState';
import useRootPath from 'Hooks/useRootPath';

import { SnapshotItem } from 'services/Content/ContentApi';
import { useAppContext } from 'middleware/AppContext';

import { formatDateDDMMMYYYY } from 'helpers';
import { DELETE_ROUTE, REPOSITORIES_ROUTE } from 'Routes/constants';
import { SNAPSHOTS_TABLE_COLUMNS } from './constants';
import { SnapshotsPrimaryActionButton } from './SnapshotsPrimaryActionButton';

interface SnapshotsTableProps {
  isFetching: boolean;
  isLoading: boolean;
  count: number;
  repoUUID: string;
  snapshotsList: SnapshotItem[];
  paginationData: PaginationLocalStorage;
  snapshotsReadOnly: boolean;
  selection: ReturnType<typeof useDataViewSelection>;
  sortProps: ReturnType<typeof useDataViewSort>;
}

// actions available: delete, bulk select, sort by name, paginate
const SnapshotsTableWithToolbars = ({
  snapshotsList,
  paginationData,
  isFetching,
  isLoading,
  count,
  snapshotsReadOnly,
  repoUUID,
  selection,
  sortProps,
}: SnapshotsTableProps) => {
  const { rbac } = useAppContext();
  const navigate = useNavigate();
  const rootPath = useRootPath();

  const { selected, onSelect, isSelected } = selection;
  const { sortBy, direction, onSort } = sortProps;
  const paginationProps = {
    ...paginationData,
    itemCount: count,
  };
  const isFetchingOrLoading = isFetching || isLoading;
  const isLoadingOrZeroCount = isFetchingOrLoading || !count;

  const activeState = useTableActiveState({ isLoading, count, isFetching });
  const shouldEnableBulkSelection =
    !snapshotsReadOnly && rbac?.repoWrite && count >= 2 && activeState === undefined;

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

  // DataView table props, rows and columns
  const ouiaId = 'snapshot_list_table';

  const dataViewColumns: DataViewTh[] = SNAPSHOTS_TABLE_COLUMNS.map((col, index) => ({
    cell: col.name,
    props: col.sortAttribute ? { sort: getSortParams(index) } : {},
  }));

  const rowActions = useCallback(
    (snapUuid: string): IAction[] =>
      snapshotsReadOnly
        ? []
        : [
            {
              isDisabled: count < 2,
              title: 'Delete',
              onClick: () => navigate(`${DELETE_ROUTE}?snapshotUUID=${snapUuid}`),
            },
          ],
    [snapshotsReadOnly, count, navigate],
  );

  const kebab = useCallback(
    (snapUuid: string) => {
      if (snapshotsReadOnly) return [];
      return [
        {
          cell: (
            <ConditionalTooltip
              content={
                count < 2
                  ? "You can't delete the last snapshot in a repository"
                  : 'You do not have the required permissions to perform this action.'
              }
              show={!snapshotsReadOnly && (!rbac?.repoWrite || count < 2)}
              setDisabled
            >
              <ActionsColumn items={rowActions(snapUuid)} />
            </ConditionalTooltip>
          ),
          props: { isActionCell: true },
        },
      ];
    },
    [snapshotsReadOnly, rbac?.repoWrite, count, rowActions],
  );

  const dataViewRows: DataViewTrObject[] = useMemo(
    () =>
      snapshotsList.map(
        ({ uuid: snapUuid, created_at, content_counts, added_counts, removed_counts }) => ({
          id: snapUuid,
          row: [
            { cell: formatDateDDMMMYYYY(created_at, true) },
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
            ...kebab(snapUuid),
          ],
        }),
      ),
    [snapshotsList, repoUUID, rootPath, navigate, kebab],
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

  const deleteButtonLabel = useMemo(() => {
    if (!selected.length || !rbac?.repoWrite) return 'Delete selected snapshots';
    if (selected.length === count) return "Can't delete all snapshots";
    return `Delete ${selected.length} snapshots`;
  }, [selected.length, count, rbac?.repoWrite]);

  const bulkSelect = (
    <BulkSelect
      isDataPaginated
      onSelect={handleBulkSelect}
      selectedCount={selected.length}
      pageCount={dataViewRows.length}
      pageSelected={isPageSelected}
      pagePartiallySelected={isPagePartiallySelected}
      menuToggleCheckboxProps={{
        id: 'bulk-select-snapshots-checkbox',
        isDisabled: isLoadingOrZeroCount,
      }}
    />
  );

  // primary actions dropdown
  const navigateOnDeleteClick = () => navigate(DELETE_ROUTE);
  const isDeleteDisabled =
    isLoadingOrZeroCount || !selected.length || selected.length === count || !rbac?.repoWrite;

  const actionsDropdown = (
    <SnapshotsPrimaryActionButton
      deleteButtonLabel={deleteButtonLabel}
      onDeleteClick={navigateOnDeleteClick}
      isDeleteDisabled={isDeleteDisabled}
      isFetchingOrLoading={isFetchingOrLoading}
      isNothingToDelete={count === 1}
      rbac={rbac}
    />
  );

  const bulkActionProps = shouldEnableBulkSelection
    ? { bulkSelect, actions: actionsDropdown }
    : snapshotsReadOnly
      ? {}
      : { actions: actionsDropdown };

  // pagination
  const topPagination = (
    <Pagination
      id='top-pagination-id'
      widgetId='topPaginationWidgetId'
      {...paginationProps}
      isCompact
      isDisabled={isFetchingOrLoading}
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
