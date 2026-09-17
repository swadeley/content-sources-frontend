import { useCallback, useEffect, useMemo } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';

import {
  useDataViewSelection,
  useDataViewSort,
} from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { Button, Modal, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { InnerScrollContainer } from '@patternfly/react-table';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';

import SnapshotsTableWithToolbars from 'components/Tables/Snapshots/SnapshotsTableWithToolbars';
import { SNAPSHOTS_TABLE_COLUMNS } from 'components/Tables/Snapshots/constants';

import { useGetSnapshotList } from 'services/Content/ContentQueries';

import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';
import { usePaginationLocalStorage } from 'Hooks/tables/usePaginationLocalStorage';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { useIsSnapshotType } from 'Hooks/usePublishSnapshot';

const perPageKey = 'snapshotPerPage';

const SnapshotListModal = () => {
  const repoUUID = useSafeUUIDParam('repoUUID');

  const onClose = useNavigateTo('repositories');

  const { isSnapshotsReadOnly, repositoryName } = useIsSnapshotType(repoUUID);

  const paginationData = usePaginationLocalStorage({ key: perPageKey });
  const { page, perPage, setPage } = paginationData;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { onSelect, selected } = selection;

  const sortProps = useDataViewSort({ defaultDirection: 'desc' });
  const { sortBy, direction } = sortProps;

  const sortString = useMemo(() => {
    if (!sortBy || !direction) return 'created_at:desc';
    const column = SNAPSHOTS_TABLE_COLUMNS.find((col) => col.name === sortBy);
    if (!column || !column.sortAttribute) return 'created_at:desc';
    return `${column.sortAttribute}:${direction}`;
  }, [sortBy, direction]);

  useEffect(() => {
    setPage(1);
  }, [sortString]);

  const {
    isLoading,
    isFetching,
    isError,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useGetSnapshotList(repoUUID, page, perPage, sortString);

  useEffect(() => {
    if (isError) {
      onClose();
    }
  }, [isError]);

  const {
    data: snapshotsList = [],
    meta: { count = 0 },
  } = data;

  // required for outlet to confirm action
  const clearCheckedSnapshots = useCallback(() => onSelect(false), [onSelect]);

  const checkedSnapshots = useMemo(() => new Set<string>(selected.map((s) => s.id)), [selected]);

  const outletData = {
    clearCheckedSnapshots,
    deletionContext: {
      checkedSnapshots,
    },
  };

  return (
    <>
      <Outlet context={outletData} />
      <Modal
        key={repoUUID}
        position='top'
        aria-labelledby='snapshot-list-modal-title'
        aria-describedby='snapshot-list-modal-description'
        ouiaId='snapshot_list_modal'
        variant={ModalVariant.medium}
        isOpen
        onClose={onClose}
      >
        <ModalHeader
          title='Snapshots'
          labelId='snapshot-list-modal-title'
          description={`View list of snapshots for ${repositoryName ? repositoryName : 'a repository'}.`}
          descriptorId='snapshot-list-modal-description'
        />
        <InnerScrollContainer>
          <div className={spacing.pSm}>
            <SnapshotsTableWithToolbars
              snapshotsList={snapshotsList}
              paginationData={paginationData}
              isFetching={isFetching}
              isLoading={isLoading}
              count={count}
              snapshotsReadOnly={isSnapshotsReadOnly}
              repoUUID={repoUUID}
              selection={selection}
              sortProps={sortProps}
            />
          </div>
        </InnerScrollContainer>
        <ModalFooter>
          <Button key='close' variant='secondary' onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export const useSnapshotListOutletContext = () =>
  useOutletContext<{
    clearCheckedSnapshots: () => void;
    deletionContext: {
      checkedSnapshots: Set<string>;
    };
  }>();

export default SnapshotListModal;
