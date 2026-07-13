import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigationType, useSearchParams } from 'react-router-dom';

import useDebounce from 'Hooks/useDebounce';

import {
  type LightwellPackagesParams,
  parseSearchParams,
  buildSearchParams,
} from './lightwellPackagesParams';

/**
 * Syncs packages table search and page state with URL search params
 *
 * Use packagesParams when navigating to package details so table state is preserved
 */
export const useLightwellPackagesParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = parseSearchParams(searchParams);
  const navigationType = useNavigationType();

  // Track the last debounced search so page doesn't reset on initial load from the URL
  const prevDebouncedSearch = useRef<string | undefined>(undefined);

  const [searchQuery, setSearchQuery] = useState(initialParams.search);
  const [page, setPage] = useState(initialParams.page);

  const debouncedSearchQuery = useDebounce(searchQuery, searchQuery === '' ? 0 : 500);
  const debouncedSearch = searchQuery === '' ? '' : debouncedSearchQuery;

  const packagesParams = useMemo<LightwellPackagesParams>(
    () => ({ search: debouncedSearch, page }),
    [debouncedSearch, page],
  );

  const onSetPage = (_, newPage: number) => setPage(newPage);

  // Reset to first page when the debounced filter changes
  useEffect(() => {
    if (prevDebouncedSearch.current === undefined) {
      prevDebouncedSearch.current = debouncedSearch;
      return;
    }

    if (prevDebouncedSearch.current !== debouncedSearch) {
      prevDebouncedSearch.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  // URL -> state: via back/forward, breadcrumb, or bookmarked link
  useEffect(() => {
    if (navigationType === 'REPLACE') return;

    const parsedParams = parseSearchParams(searchParams);
    setSearchQuery(parsedParams.search);
    setPage(parsedParams.page);
    prevDebouncedSearch.current = parsedParams.search;
  }, [searchParams, navigationType]);

  // State -> URL: keep the address bar in sync with the current filter and page
  useEffect(() => {
    const nextParams = buildSearchParams({ search: debouncedSearch, page });

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, page, searchParams, setSearchParams]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    page,
    setPage,
    onSetPage,
    packagesParams,
  };
};
