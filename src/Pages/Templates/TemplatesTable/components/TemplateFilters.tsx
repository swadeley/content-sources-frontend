import { useEffect, useMemo, useState } from 'react';
import {
  Label,
  LabelGroup,
  Button,
  Flex,
  FlexItem,
  InputGroup,
  TextInput,
  InputGroupItem,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
} from '@patternfly/react-core';

import { FilterIcon, SearchIcon } from '@patternfly/react-icons';
import Hide from 'components/Hide/Hide';
import { RepositoryParamsResponse } from 'services/Content/ContentApi';
import { useQueryClient } from 'react-query';
import { REPOSITORY_PARAMS_KEY } from 'services/Content/ContentQueries';
import useDebounce from 'Hooks/useDebounce';
import { createUseStyles } from 'react-jss';
import { isEmpty } from 'lodash';
import { useAppContext } from 'middleware/AppContext';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';
import { useNavigate } from 'react-router-dom';
import { TemplateFilterData } from 'services/Templates/TemplateApi';

interface Props {
  isLoading?: boolean;
  setFilterData: (filterData: TemplateFilterData) => void;
  filterData: TemplateFilterData;
}

const useStyles = createUseStyles({
  chipsContainer: {
    paddingTop: '16px',
  },
  clearFilters: {
    marginLeft: '16px',
  },
  // Needed to fix styling when "Add repositories" button is disabled
  repositoryActions: {
    display: 'flex',
    flexDirection: 'row',
  },
});

export type Filters = 'Name' | 'Version' | 'Architecture';

const Filters = ({ isLoading, setFilterData, filterData }: Props) => {
  const classes = useStyles();
  const { rbac, subscriptions } = useAppContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isActionOpen, setActionOpen] = useState(false);
  const [typeFilterOpen, setTypeFilterOpen] = useState(false);
  const filters = ['Name', 'Version', 'Architecture'];
  const [filterType, setFilterType] = useState<Filters>('Name');
  const [versionNamesLabels, setVersionNamesLabels] = useState({});
  const [archNamesLabels, setArchNamesLabels] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [selectedArch, setSelectedArch] = useState<string>('');

  const { distribution_arches = [], distribution_versions = [] } =
    queryClient.getQueryData<RepositoryParamsResponse>(REPOSITORY_PARAMS_KEY) || {};

  const hasRHELSubscription = !!subscriptions?.red_hat_enterprise_linux;
  const isMissingRequirements = !rbac?.templateWrite || !hasRHELSubscription;
  const missingRequirements =
    rbac?.templateWrite && !hasRHELSubscription ? 'subscription (RHEL)' : 'permission';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedVersion('');
    setSelectedArch('');
    setFilterData({ search: '', version: '', arch: '', repository_uuids: '', snapshot_uuids: '' });
  };

  useEffect(() => {
    // If the filters get cleared at the top level, sense that and clear them here.
    if (!filterData.arch && !filterData.version && !filterData.search) {
      clearFilters();
    }
  }, [filterData.arch, filterData.version, filterData.search]);

  const {
    searchQuery: debouncedSearchQuery,
    selectedVersion: debouncedSelectedVersion,
    selectedArch: debouncedSelectedArch,
  } = useDebounce({
    searchQuery,
    selectedVersion,
    selectedArch,
  });

  const getLabels = (type: 'arch' | 'version', name: string): string => {
    const namesLabels = type === 'arch' ? distribution_arches : distribution_versions;
    const found = namesLabels.find((v) => v.name === name);
    if (found) {
      return found.label;
    }
    return name;
  };

  useEffect(() => {
    setFilterData({
      search: debouncedSearchQuery,
      version: getLabels('version', debouncedSelectedVersion),
      arch: getLabels('arch', debouncedSelectedArch),
      repository_uuids: '',
      snapshot_uuids: '',
    });
  }, [debouncedSearchQuery, debouncedSelectedVersion, debouncedSelectedArch]);

  useEffect(() => {
    if (
      isEmpty(versionNamesLabels) &&
      isEmpty(archNamesLabels) &&
      distribution_arches.length !== 0 &&
      distribution_versions.length !== 0
    ) {
      const arches = {};
      const versions = {};
      distribution_arches.forEach((arch) => (arches[arch.name] = arch.label));
      distribution_versions.forEach((version) => (versions[version.name] = version.label));
      setVersionNamesLabels(versions);
      setArchNamesLabels(arches);
    }
  }, [distribution_arches, distribution_versions]);

  const Filter = useMemo(() => {
    switch (filterType) {
      case 'Name':
        return (
          <InputGroupItem isFill>
            <TextInput
              isDisabled={isLoading}
              id='name'
              ouiaId='filter_by_name'
              placeholder='Filter by name'
              value={searchQuery}
              onChange={(_event, value) => setSearchQuery(value)}
              type='search'
              customIcon={<SearchIcon />}
            />
          </InputGroupItem>
        );
      case 'Version':
        return (
          <Dropdown
            onSelect={(_, val) => {
              setSelectedVersion(val as string);
              setActionOpen(false);
            }}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                aria-label='filter version'
                id='versionSelect'
                ouiaId='filter_by_version'
                onClick={() => setActionOpen((prev) => !prev)}
                isDisabled={isLoading}
                isExpanded={isActionOpen}
              >
                {selectedVersion || 'Filter by version'}
              </MenuToggle>
            )}
            onOpenChange={(isOpen) => setActionOpen(isOpen)}
            isOpen={isActionOpen}
          >
            <DropdownList>
              {Object.keys(versionNamesLabels).map((version) => (
                <DropdownItem
                  key={version}
                  value={version}
                  isSelected={selectedVersion === version}
                  component='button'
                  data-ouia-component-id={`filter_${version}`}
                >
                  {version}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        );
      case 'Architecture':
        return (
          <Dropdown
            onSelect={(_, val) => {
              setSelectedArch(val as string);
              setActionOpen(false);
            }}
            toggle={(toggleRef) => (
              <MenuToggle
                ref={toggleRef}
                aria-label='filter architecture'
                id='architectureSelect'
                ouiaId='filter_by_architecture'
                onClick={() => setActionOpen((prev) => !prev)}
                isDisabled={isLoading}
                isExpanded={isActionOpen}
              >
                {selectedArch || 'Filter by architecture'}
              </MenuToggle>
            )}
            onOpenChange={(isOpen) => setActionOpen(isOpen)}
            isOpen={isActionOpen}
          >
            <DropdownList>
              {Object.keys(archNamesLabels).map((architecture) => (
                <DropdownItem
                  key={`arch_${architecture}`}
                  value={architecture}
                  isSelected={selectedArch === architecture}
                  component='button'
                  data-ouia-component-id={`filter_${architecture}`}
                >
                  {architecture}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        );
      default:
        return <></>;
    }
  }, [
    filterType,
    isLoading,
    searchQuery,
    versionNamesLabels,
    selectedVersion,
    archNamesLabels,
    selectedArch,
    isActionOpen,
  ]);

  return (
    <Flex direction={{ default: 'column' }}>
      <Flex>
        <FlexItem>
          <InputGroup>
            <InputGroupItem>
              <FlexItem>
                <Dropdown
                  key='filtertype'
                  onSelect={(_, val) => {
                    setFilterType(val as Filters);
                    setTypeFilterOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      icon={<FilterIcon />}
                      ref={toggleRef}
                      aria-label='filterSelectionDropdown'
                      id='filterSelectionDropdown'
                      ouiaId='filter_type_toggle'
                      onClick={() => setTypeFilterOpen((prev) => !prev)}
                      isDisabled={isLoading}
                      isExpanded={typeFilterOpen}
                    >
                      {filterType}
                    </MenuToggle>
                  )}
                  onOpenChange={(isOpen) => setTypeFilterOpen(isOpen)}
                  isOpen={typeFilterOpen}
                  ouiaId='filter_type'
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
              </FlexItem>
            </InputGroupItem>
            <InputGroupItem>
              <FlexItem>{Filter}</FlexItem>
            </InputGroupItem>
          </InputGroup>
        </FlexItem>
        <FlexItem className={classes.repositoryActions}>
          <ConditionalTooltip
            content={`You do not have the required ${missingRequirements} to perform this action.`}
            show={isMissingRequirements}
            setDisabled
          >
            <Button
              id='createContentTemplateButton'
              ouiaId='create_content_template'
              variant='primary'
              isDisabled={isLoading}
              onClick={() => navigate('add')}
            >
              Create template
            </Button>
          </ConditionalTooltip>
          {/* 
          BULK DELETE CODE
          <ConditionalTooltip
          content='You do not have the required permissions to perform this action.'
          show={!rbac?.write && !isRedHatRepository}
          setDisabled
        >
          <DeleteKebab
            isDisabled={!rbac.templateWrite && isRedHatRepository}
            atLeastOneRepoChecked={atLeastOneRepoChecked}
            numberOfReposChecked={numberOfReposChecked}
            deleteCheckedRepos={deleteCheckedRepos}
            toggleOuiaId='custom_repositories_kebab_toggle'
          />
        </ConditionalTooltip> */}
        </FlexItem>
      </Flex>
      <Hide hide={!(selectedVersion || selectedArch || searchQuery)}>
        <FlexItem className={classes.chipsContainer}>
          {selectedVersion ? (
            <LabelGroup categoryName='Version'>
              <Label variant='outline' key={selectedVersion} onClose={() => setSelectedVersion('')}>
                {selectedVersion}
              </Label>
            </LabelGroup>
          ) : (
            <></>
          )}
          {selectedArch ? (
            <LabelGroup categoryName='Architecture'>
              <Label variant='outline' key={selectedArch} onClose={() => setSelectedArch('')}>
                {selectedArch}
              </Label>
            </LabelGroup>
          ) : (
            <></>
          )}
          {searchQuery && (
            <LabelGroup categoryName='Name'>
              <Label variant='outline' key='name_chip' onClose={() => setSearchQuery('')}>
                {searchQuery}
              </Label>
            </LabelGroup>
          )}
          {((debouncedSearchQuery && searchQuery) || !!selectedVersion || !!selectedArch) && (
            <Button className={classes.clearFilters} onClick={clearFilters} variant='link' isInline>
              Clear filters
            </Button>
          )}
        </FlexItem>
      </Hide>
    </Flex>
  );
};

export default Filters;
