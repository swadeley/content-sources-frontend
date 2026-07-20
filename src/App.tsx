import '@redhat-cloud-services/frontend-components-utilities/styles/_all';
import 'react18-json-view/src/style.css';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import { Bullseye, Spinner } from '@patternfly/react-core';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { last } from 'lodash';

import Routes from './Routes';
import { useAppContext } from './middleware/AppContext';
import { ContentOrigin, FilterData } from './services/Content/ContentApi';
import { useContentListQuery } from './services/Content/ContentQueries';
import { perPageKey } from './Pages/Repositories/ContentListTable/ContentListTable';
import { CONTENT_ROUTE, REPOSITORIES_ROUTE, TEMPLATES_ROUTE } from './Routes/constants';
import usePageSafe from 'Hooks/usePageSafe';
import useContentNavDivider from 'Hooks/useContentNavDivider';
import { TemplateFilterData } from './services/Templates/TemplateApi';
import { useTemplateList } from './services/Templates/TemplateQueries';

export default function App() {
  const { rbac, isFetchingPermissions, zeroState, setZeroState } = useAppContext();
  const storedPerPage = Number(localStorage.getItem(perPageKey)) || 20;
  const { pathname } = useLocation();
  const pageSafe = usePageSafe();
  const { hideGlobalFilter } = useChrome();
  useContentNavDivider();

  const isDefaultRoute = useMemo(
    () =>
      [REPOSITORIES_ROUTE, '', CONTENT_ROUTE, TEMPLATES_ROUTE].includes(
        last(pathname.split('/')) || '',
      ),
    [pathname],
  );

  const [filterData] = useState<FilterData>({
    search: '',
    versions: [],
    arches: [],
    statuses: [],
  });

  const [templateFilterData] = useState<TemplateFilterData>({
    search: '',
    arch: '',
    version: [],
    extended_release_version: [],
    restrict_to_major: false,
    repository_uuids: '',
    snapshot_uuids: '',
    extended_release: [],
  });

  const enableZeroStateCheck = isDefaultRoute && zeroState;

  const { data = { data: [], meta: { count: 0, limit: 20, offset: 0 } }, isLoading } =
    useContentListQuery(
      1,
      storedPerPage,
      filterData,
      '',
      [ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD],
      enableZeroStateCheck,
    );

  const {
    data: templateData = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
    isLoading: isLoadingTemplates,
  } = useTemplateList(1, 1, '', templateFilterData, false, enableZeroStateCheck);

  // Hide Insights' global filter bar
  useEffect(() => {
    hideGlobalFilter(true);
  }, [hideGlobalFilter]);

  // Check for user's custom repositories and templates to determine whether we need to show zero state
  useEffect(() => {
    if (zeroState && (data.data.length > 0 || templateData.meta.count > 0 || !isDefaultRoute)) {
      setZeroState(false);
    }
  }, [data.data.length, templateData.meta.count, zeroState, isDefaultRoute, setZeroState]);

  if (!rbac || isFetchingPermissions || isLoading || isLoadingTemplates) {
    return (
      <Bullseye>
        <div data-ouia-safe={false} />
        <Spinner size='xl' />
      </Bullseye>
    );
  }

  return (
    <>
      <div data-ouia-safe={pageSafe} />
      <Routes />
    </>
  );
}
