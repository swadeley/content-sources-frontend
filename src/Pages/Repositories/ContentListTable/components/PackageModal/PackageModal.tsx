import { Button, Modal, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { InnerScrollContainer } from '@patternfly/react-table';
import { useCallback, useEffect, useMemo } from 'react';
import { PackageWithUUID } from 'services/Content/ContentApi';
import { useGetPackagesQuery } from 'services/Content/ContentQueries';
import { Outlet, useOutletContext } from 'react-router-dom';
import PackagesTableWithToolbars from 'components/Tables/Packages/PackagesTableWithToolbars';
import { usePaginationLocalStorage } from 'Hooks/tables/usePaginationLocalStorage';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { usePackageTableFilters } from 'components/Tables/Packages/hooks/usePackageTableFilters';
import { useEnableDelete } from './hooks/useEnableDelete';
import { useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';

const perPageKey = 'packagePerPage';

export default function PackageModal() {
  const repoUUID = useSafeUUIDParam('repoUUID');

  const onClose = useNavigateTo('repositories');

  const filterData = usePackageTableFilters();
  const { debouncedSearch } = filterData;

  const [isUploadRepository, isFetchRepoError] = useEnableDelete(repoUUID);

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { onSelect, selected } = selection;

  const paginationData = usePaginationLocalStorage({ key: perPageKey });
  const { page, perPage } = paginationData;

  const {
    isLoading,
    isFetching,
    isError,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useGetPackagesQuery(repoUUID, page, perPage, debouncedSearch);

  useEffect(() => {
    if (isError || isFetchRepoError) {
      onClose();
    }
  }, [isError, isFetchRepoError]);

  const {
    data: packagesList = [],
    meta: { count = 0 },
  } = data;

  // required for outlet to confirm delete packages
  const clearSelectedPackages = useCallback(() => onSelect(false), [onSelect]);

  const selectedPackages = useMemo(() => {
    const ids = selected.map((s) => s.id);
    return packagesList.filter((p) => ids.includes(p.uuid));
  }, [selected, packagesList]);

  const outletData = { clearSelectedPackages, deletionContext: { selectedPackages } };

  return (
    <>
      <Outlet context={outletData} />
      <Modal
        key={repoUUID}
        position='top'
        ouiaId='rpm_package_modal'
        variant={ModalVariant.medium}
        isOpen
        onClose={onClose}
        aria-labelledby='rpm-package-modal-title'
        aria-describedby='rpm-package-modal-description'
      >
        <ModalHeader
          title='Packages in the latest snapshot'
          labelId='rpm-package-modal-title'
          description='View list of packages'
          descriptorId='rpm-package-modal-description'
        />
        <InnerScrollContainer>
          <div className={spacing.pSm}>
            <PackagesTableWithToolbars
              packagesList={packagesList}
              paginationData={paginationData}
              isFetching={isFetching}
              isLoading={isLoading}
              count={count}
              filterProps={{ ...filterData }}
              selection={selection}
              enabledBulkDelete={isUploadRepository}
              enabledRowActions={isUploadRepository}
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
}

export const usePackageModalOutletContext = () =>
  useOutletContext<{
    clearSelectedPackages: () => void;
    deletionContext: {
      selectedPackages: PackageWithUUID[];
    };
  }>();
