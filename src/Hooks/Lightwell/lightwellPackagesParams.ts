/**
 * Helpers for Lightwell packages table URL search params (search filter and page index)
 */
export type LightwellPackagesParams = {
  search: string;
  page: number;
};

export const LIGHTWELL_PACKAGES_SEARCH_PARAM = 'search';
export const LIGHTWELL_PACKAGES_PAGE_PARAM = 'page';

const DEFAULT_PACKAGES_PARAMS: LightwellPackagesParams = {
  search: '',
  page: 1,
};

const parsePageParam = (value: string | null): number => {
  if (!value) return DEFAULT_PACKAGES_PARAMS.page;

  const page = Number.parseInt(value, 10);
  return page >= 1 ? page : DEFAULT_PACKAGES_PARAMS.page;
};

/**
 * Parses search params from the URL
 *
 * Empty or invalid page values default to 1; Empty search defaults to ''
 */
export const parseSearchParams = (searchParams: URLSearchParams): LightwellPackagesParams => ({
  search: searchParams.get(LIGHTWELL_PACKAGES_SEARCH_PARAM) ?? DEFAULT_PACKAGES_PARAMS.search,
  page: parsePageParam(searchParams.get(LIGHTWELL_PACKAGES_PAGE_PARAM)),
});

// Builds search params from state, omitting default values
export const buildSearchParams = (params: LightwellPackagesParams): URLSearchParams => {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set(LIGHTWELL_PACKAGES_SEARCH_PARAM, params.search);
  }

  if (params.page > 1) {
    searchParams.set(LIGHTWELL_PACKAGES_PAGE_PARAM, params.page.toString());
  }

  return searchParams;
};

/**
 * Appends search params to a path
 *
 * Returns the path unchanged when all params are at their defaults
 */
export const appendSearchParams = (path: string, params: LightwellPackagesParams): string => {
  const query = buildSearchParams(params).toString();
  return query ? `${path}?${query}` : path;
};
