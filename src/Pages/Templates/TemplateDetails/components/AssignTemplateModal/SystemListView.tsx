import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import React, { useState, useMemo, useEffect } from 'react';
import useDebounce from '../../../../../Hooks/useDebounce';
import type { TemplateItem } from '../../../../../services/Templates/TemplateApi';
import {
  useSystemsListQuery,
  GET_SYSTEMS_KEY,
} from '../../../../../services/Systems/SystemsQueries';
import {
  TextInput,
  InputGroup,
  InputGroupItem,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
  FlexItem,
  ToggleGroup,
  ToggleGroupItem,
  Pagination,
  Flex,
  PaginationVariant,
  Button,
  Title,
  Spinner,
} from '@patternfly/react-core';
import { SearchIcon, FilterIcon, SyncAltIcon } from '@patternfly/react-icons';
import TagsFilter from '../../../../../components/TagsFilter/TagsFilter';
import { InnerScrollContainer } from '@patternfly/react-table';
import Hide from '../../../../../components/Hide/Hide';
import SystemListTable from './SystemListTable';
import Loader from '../../../../../components/Loader';
import { createUseStyles } from 'react-jss';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { TEMPLATE_SYSTEMS_UPDATE_LIMIT } from 'Pages/Templates/TemplatesTable/constants';
import {
  isVersionLockedSystem,
  canAssignSystemToTemplate,
  isExtendedSupportTemplate,
} from '../../../TemplatesTable/helpers';

const useStyles = createUseStyles({
  topContainer: {
    justifyContent: 'space-between',
    height: 'fit-content',
  },
  leftMargin: {
    marginLeft: '1rem',
    '& button': {
      textWrap: 'nowrap',
    },
  },
  fullWidth: {
    width: 'auto',
    maxWidth: 'unset',
  },
});

const perPageKey = 'templatesPerPage';
type FilterType = 'Name' | 'Tags';

type Props = {
  selectedSystems: string[];
  setSelectedSystems: React.Dispatch<React.SetStateAction<string[]>>;
  template: Partial<
    Pick<TemplateItem, 'version' | 'arch' | 'extended_release' | 'extended_release_version'>
  >;
  setCanAssignTemplate: React.Dispatch<React.SetStateAction<boolean>>;
  handleModalClose: () => void;
};

const SystemListView = ({
  selectedSystems,
  setSelectedSystems,
  template: { version, arch, extended_release, extended_release_version },
  setCanAssignTemplate,
  handleModalClose,
}: Props) => {
  const queryClient = useQueryClient();
  const classes = useStyles();
  const { templateUUID: uuid = '' } = useParams();

  const storedPerPage = Number(localStorage.getItem(perPageKey)) || 20;
  const [page, setPage] = useState(1);
  const [toggled, setToggled] = useState(false);
  const [perPage, setPerPage] = useState(storedPerPage);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedList = useMemo(() => new Set(selectedSystems), [selectedSystems]);
  const [filterType, setFilterType] = useState<FilterType>('Name');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!selectedList.size) {
      setToggled(false);
    }
  }, [selectedList]);

  const debouncedSearchQuery = useDebounce(searchQuery, !searchQuery ? 0 : 500);

  const debouncedSelected = useDebounce(selectedSystems, !selectedSystems.length ? 0 : 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  const {
    isLoading,
    isFetching,
    isError,
    data = { data: [], meta: { total_items: 0, limit: 20, offset: 0 } },
  } = useSystemsListQuery(page, perPage, debouncedSearchQuery, {
    os: version,
    arch: arch,
    ids: toggled ? debouncedSelected : undefined,
    tags: selectedTags,
  });

  const templateUsesExtendedSupport = isExtendedSupportTemplate(
    extended_release,
    extended_release_version,
  );

  const {
    data: systemsList = [],
    meta: { total_items = 0 },
  } = data;

  const versionLockedSystems = useMemo(
    () =>
      systemsList
        .filter((system) => isVersionLockedSystem(system.attributes.rhsm))
        .map(({ id }) => id),
    [systemsList],
  );

  const satelliteSystems = useMemo(
    () => systemsList.filter((system) => system.attributes.satellite_managed).map(({ id }) => id),
    [systemsList],
  );

  const imageBasedSystems = useMemo(
    () => systemsList.filter((system) => system.attributes.image_based).map(({ id }) => id),
    [systemsList],
  );

  const allVersionLocked = versionLockedSystems.length === systemsList.length;
  const allSatellite = satelliteSystems.length === systemsList.length;
  const allImageBased = imageBasedSystems.length === systemsList.length;

  // True when at least some systems on the page have a compatible release version and are not satellite-managed and not image-based
  const canEnableAssignButton =
    !allSatellite && (templateUsesExtendedSupport || !allVersionLocked) && !allImageBased;

  // Systems that are compatible with the template, not satellite-managed, not image-based, and not already assigned
  const selectableSystems = useMemo(
    () =>
      systemsList.filter(
        ({ attributes: { template_uuid, rhsm, satellite_managed, image_based } }) =>
          canAssignSystemToTemplate(
            rhsm,
            satellite_managed,
            image_based,
            template_uuid !== uuid,
            templateUsesExtendedSupport,
          ),
      ),
    [systemsList, uuid, templateUsesExtendedSupport],
  );

  // Informs the parent modal whether it is safe to enable the template "Assign" button
  useEffect(() => {
    setCanAssignTemplate(
      selectedSystems.length > 0 &&
        selectedSystems.length <= TEMPLATE_SYSTEMS_UPDATE_LIMIT &&
        canEnableAssignButton,
    );
  }, [selectedSystems, canEnableAssignButton]);

  const isPageSelected = useMemo(() => {
    if (!canEnableAssignButton || selectableSystems.length === 0) return false;
    return selectableSystems.every(({ id }) => selectedList.has(id));
  }, [canEnableAssignButton, selectableSystems, selectedList]);

  useEffect(() => {
    if (isError) {
      handleModalClose();
    }
  }, [isError]);

  const onSetPage = (_, newPage: number) => setPage(newPage);

  const onPerPageSelect = (_, newPerPage: number, newPage: number) => {
    // Save this value through page refresh for use on the next reload
    setPerPage(newPerPage);
    setPage(newPage);
    localStorage.setItem(perPageKey, newPerPage.toString());
  };

  const handleSelectSystem = (id: string) => {
    if (selectedList.has(id)) {
      const newItems = selectedSystems.filter((listId) => listId !== id);

      setSelectedSystems([...newItems]);

      if (newItems.length % perPage === 0 && page > 1) {
        setPage((prev) => prev - 1);
      }
    } else {
      setSelectedSystems((prev) => [...prev, id]);
    }
  };

  const selectAllToggle = () => {
    if (isPageSelected) {
      // Deselect all items that are on the page
      const systemsListSet = new Set(systemsList.map(({ id }) => id));
      setSelectedSystems([...selectedSystems.filter((id) => !systemsListSet.has(id))]);
    } else {
      setSelectedSystems((prev) => [
        ...new Set([...prev, ...selectableSystems.map(({ id }) => id)]),
      ]);
    }
  };

  const fetchingOrLoading = isFetching || isLoading;

  const loadingOrZeroCount = fetchingOrLoading || !total_items;

  const filters: FilterType[] = ['Name', 'Tags'];

  const Filter = useMemo(() => {
    switch (filterType) {
      case 'Name':
        return (
          <TextInput
            id='search'
            type='search'
            className={classes.fullWidth}
            customIcon={<SearchIcon />}
            ouiaId='filter_search'
            placeholder='Filter by name'
            value={searchQuery}
            onChange={(_event, value) => {
              setSearchQuery(value);
            }}
          />
        );
      case 'Tags':
        return <TagsFilter selectedTags={selectedTags} setSelectedTags={setSelectedTags} />;
    }
  }, [filterType, selectedTags, searchQuery]);

  const SystemListRefreshHeader = useMemo(
    () => (
      <Flex>
        <FlexItem>
          <Title headingLevel='h6'>Select systems</Title>
        </FlexItem>
        <FlexItem>
          <Button
            id='refreshSystemsList'
            ouiaId='refresh_systems_list'
            variant='link'
            icon={isFetching ? <Spinner isInline /> : <SyncAltIcon />}
            isDisabled={isLoading || isFetching}
            onClick={() => queryClient.invalidateQueries({ queryKey: [GET_SYSTEMS_KEY] })}
            className={spacing.py_0}
          >
            Refresh
          </Button>
        </FlexItem>
      </Flex>
    ),
    [isFetching, isLoading, queryClient],
  );

  return (
    <InnerScrollContainer>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} height='100%'>
        {SystemListRefreshHeader}
        <FlexItem>
          <InputGroup className={classes.topContainer}>
            <InputGroupItem>
              <InputGroup>
                <Dropdown
                  key='filtertype'
                  onSelect={(_, val) => {
                    setFilterType(val as FilterType);
                    setFilterOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      icon={<FilterIcon />}
                      ref={toggleRef}
                      className={classes.fullWidth}
                      aria-label='filterSelectionDropdown'
                      id='typeSelect'
                      onClick={() => setFilterOpen((prev) => !prev)}
                    >
                      {filterType}
                    </MenuToggle>
                  )}
                  onOpenChange={(isOpen) => setFilterOpen(isOpen)}
                  isOpen={filterOpen}
                  aria-label='filter type'
                >
                  <DropdownList>
                    {filters.map((filter) => (
                      <DropdownItem
                        key={filter}
                        value={filter}
                        isSelected={filterType === filter}
                        component='button'
                        data-ouia-component-id={`filter_${filter}`}
                      >
                        {filter}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
                {Filter}
              </InputGroup>
              <Hide hide={!total_items}>
                <FlexItem className={classes.leftMargin}>
                  <ToggleGroup aria-label='Default with single selectable'>
                    <ToggleGroupItem
                      text='All'
                      buttonId='custom-repositories-toggle-button'
                      data-ouia-component-id='all-selected-repositories-toggle'
                      isSelected={!toggled}
                      onChange={() => setToggled(false)}
                    />
                    <ToggleGroupItem
                      text={`Selected (${selectedSystems.length})`}
                      buttonId='custom-repositories-selected-toggle-button'
                      data-ouia-component-id='custom-selected-repositories-toggle'
                      isSelected={toggled}
                      isDisabled={!selectedSystems.length}
                      onChange={() => {
                        setToggled(true);
                        setPage(1);
                      }}
                    />
                  </ToggleGroup>
                </FlexItem>
              </Hide>
            </InputGroupItem>
            <Hide hide={isLoading}>
              <Pagination
                id='top-pagination-id'
                widgetId='topPaginationWidgetId'
                itemCount={total_items}
                perPage={perPage}
                page={page}
                onSetPage={onSetPage}
                isCompact
                onPerPageSelect={onPerPageSelect}
              />
            </Hide>
          </InputGroup>

          <Hide hide={isLoading}>
            <SystemListTable
              isExtendedSupportTemplate={templateUsesExtendedSupport}
              perPage={perPage}
              isFetchingOrLoading={fetchingOrLoading}
              isLoadingOrZeroCount={loadingOrZeroCount}
              systemsList={systemsList}
              selected={selectedList}
              setSelected={(id) => handleSelectSystem(id)}
              selectAllToggle={selectAllToggle}
              isPageSelected={isPageSelected}
            />
          </Hide>
          <Hide hide={!isLoading}>
            <Loader />
          </Hide>

          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <FlexItem />
            <FlexItem>
              <Hide hide={isLoading}>
                <Pagination
                  id='bottom-pagination-id'
                  widgetId='bottomPaginationWidgetId'
                  itemCount={total_items}
                  perPage={perPage}
                  page={page}
                  onSetPage={onSetPage}
                  variant={PaginationVariant.bottom}
                  onPerPageSelect={onPerPageSelect}
                />
              </Hide>
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
    </InnerScrollContainer>
  );
};

export default SystemListView;
