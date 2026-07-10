import { AlertVariant } from '@patternfly/react-core';
import { useState } from 'react';
import {
  keepPreviousData,
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { cloneDeep } from 'lodash';

import {
  ContentListResponse,
  deleteContentListItem,
  getContentList,
  getRepositoryParams,
  AddContentListItems,
  CreateContentRequest,
  FilterData,
  validateContentListItems,
  EditContentListItem,
  getGpgKey,
  getPackages,
  getPopularRepositories,
  PopularRepositoriesResponse,
  CreateContentRequestResponse,
  ContentItem,
  introspectRepository,
  IntrospectRepositoryRequestItem,
  fetchContentItem,
  deleteContentListItems,
  Meta,
  ErrorResponse,
  getSnapshotList,
  SnapshotListResponse,
  ContentOrigin,
  getRepoConfigFile,
  triggerSnapshot,
  getSnapshotsByDate,
  getSnapshotPackages,
  getSnapshotErrata,
  type EditContentRequestItem,
  type ValidateContentRequestItem,
  addUploads,
  type AddUploadRequest,
  deleteSnapshots,
  getLatestRepoConfigFile,
  PopularRepository,
  bulkRemoveRepositoryRpms,
  getLightwellRepositoryPackages,
  getPythonPackageDetail,
  getPythonPackageVersions,
  getMavenPackageDetail,
  getMavenPackageVersionsList,
} from './ContentApi';
import { ADMIN_TASK_LIST_KEY } from '../Admin/AdminTaskQueries';
import useErrorNotification from 'Hooks/useErrorNotification';
import useNotification from 'Hooks/useNotification';
import {
  GET_TEMPLATES_KEY,
  GET_TEMPLATE_PACKAGES_KEY,
  TEMPLATE_ERRATA_KEY,
  TEMPLATE_SNAPSHOTS_KEY,
  TEMPLATES_FOR_SNAPSHOTS,
} from '../Templates/TemplateQueries';

export const CONTENT_LIST_KEY = 'CONTENT_LIST_KEY';
export const POPULAR_REPOSITORIES_LIST_KEY = 'POPULAR_REPOSITORIES_LIST_KEY';
export const REPOSITORY_PARAMS_KEY = 'REPOSITORY_PARAMS_KEY';
export const CREATE_PARAMS_KEY = 'CREATE_PARAMS_KEY';
export const PACKAGES_KEY = 'PACKAGES_KEY';
export const LIGHTWELL_REPOSITORY_PACKAGES_KEY = 'LIGHTWELL_REPOSITORY_PACKAGES_KEY';
export const MAVEN_PACKAGE_DETAIL_KEY = 'MAVEN_PACKAGE_DETAIL_KEY';
export const MAVEN_PACKAGE_VERSIONS_LIST_KEY = 'MAVEN_PACKAGE_VERSIONS_LIST_KEY';
export const PYTHON_PACKAGE_DETAIL_KEY = 'PYTHON_PACKAGE_DETAIL_KEY';
export const PYTHON_PACKAGE_VERSIONS_KEY = 'PYTHON_PACKAGE_VERSIONS_KEY';
export const SNAPSHOT_PACKAGES_KEY = 'SNAPSHOT_PACKAGES_KEY';
export const SNAPSHOT_ERRATA_KEY = 'SNAPSHOT_ERRATA_KEY';
export const LIST_SNAPSHOTS_KEY = 'LIST_SNAPSHOTS_KEY';
export const CONTENT_ITEM_KEY = 'CONTENT_ITEM_KEY';
export const REPO_CONFIG_FILE_KEY = 'REPO_CONFIG_FILE_KEY';
export const LATEST_REPO_CONFIG_FILE_KEY = 'LATEST_REPO_CONFIG_FILE_KEY';
export const REPO_COUNT_KEY = 'REPO_COUNT_KEY';

const CONTENT_LIST_POLLING_TIME = 10000; // 10 seconds

const buildContentListKey = (
  page: number,
  limit: number,
  sortBy?: string,
  contentOrigin?: ContentOrigin[],
  filterData?: Partial<FilterData>,
) =>
  `${page}${limit}${sortBy}${contentOrigin?.sort().join(',')}${filterData?.arches?.join(
    '',
  )}${filterData?.versions?.join('')}${filterData?.urls?.join('')}${filterData?.uuids?.join(
    '',
  )}${filterData?.statuses?.join('')}${filterData?.availableForArch}${filterData?.availableForVersion}${filterData?.search}${filterData?.name}${filterData?.extended_release}${filterData?.extended_release_version}${filterData?.feature_name}${filterData?.partner}`;

export const useFetchContent = (uuid: string, enabled = true) =>
  useQuery({
    queryKey: [CONTENT_ITEM_KEY, uuid],
    queryFn: () => fetchContentItem(uuid),
    meta: {
      title: 'Unable to find associated repository.',
      id: 'fetch-content-error',
    },
    placeholderData: keepPreviousData,
    staleTime: 20000,
    enabled,
  });

export const usePopularRepositoriesQuery = (
  page: number,
  limit: number,
  filterData?: Partial<FilterData>,
  sortBy?: string,
) =>
  useQuery({
    queryKey: [
      POPULAR_REPOSITORIES_LIST_KEY,
      page,
      limit,
      sortBy,
      ...Object.values(filterData || {}),
    ],
    // NOTE: Update this if larger list!!!!
    queryFn: () => getPopularRepositories(page, limit, filterData, sortBy),
    placeholderData: keepPreviousData,
    staleTime: 20000,
    meta: {
      title: 'Unable to get popular repositories list',
      id: 'popular-repository-error',
    },
  });

export const useContentListQuery = (
  page: number,
  limit: number,
  filterData: FilterData,
  sortBy: string,
  contentOrigin: ContentOrigin[],
  enabled: boolean = true,
  polling: boolean = false,
  overrides?: Partial<UseQueryOptions<ContentListResponse>>,
) =>
  useQuery({
    // Below MUST match the "contentListKeyArray" seen below in the useDeleteContent.
    queryKey: [
      CONTENT_LIST_KEY,
      buildContentListKey(page, limit, sortBy, contentOrigin, filterData),
    ],

    queryFn: () => getContentList(page, limit, filterData, sortBy, contentOrigin),

    meta: {
      title: 'Unable to get repositories list',
      id: 'content-list-error',
    },

    refetchInterval: polling ? CONTENT_LIST_POLLING_TIME : undefined,

    // This prevents endless polling when our app isn't the focus tab in a browser
    refetchIntervalInBackground: false,

    // If polling and navigate to another tab, on refocus, we want to poll once more. (This is based off of the stalestime below)
    refetchOnWindowFocus: polling,

    placeholderData: keepPreviousData,
    staleTime: 20000,
    enabled,
    ...overrides,
  });

export const useRepositoryCount = (contentOrigins: ContentOrigin[]) =>
  useQuery({
    queryKey: [REPO_COUNT_KEY, ...contentOrigins],
    queryFn: () => getContentList(1, 1, { statuses: ['Valid'] }, '', contentOrigins),
    select: (data) => data.meta.count,
    staleTime: 60_000,
    meta: {
      title: 'Unable to get repository count',
      id: 'repo-count-error',
    },
  });

export const useAddContentQuery = (request: CreateContentRequest) => {
  const queryClient = useQueryClient();
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  return useMutation({
    mutationFn: () => AddContentListItems(request.filter((item) => !!item)),

    onSuccess: (data: CreateContentRequestResponse) => {
      const hasPending = (data as ContentItem[]).some(({ status }) => status === 'Pending');

      notify({
        variant: AlertVariant.success,
        title:
          request?.length > 1
            ? `${request?.length} custom repositories added`
            : `Custom repository "${request?.[0]?.name}" added`,
        ...(request[0]?.origin === ContentOrigin.UPLOAD
          ? {}
          : {
              description: hasPending
                ? 'Repository introspection in progress'
                : 'Repository introspection data already available',
            }),
      });

      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [POPULAR_REPOSITORIES_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Error adding items to content list',
        'An error occurred',
        err,
        'add-content-error',
      );
    },
  });
};

export const useAddUploadsQuery = (request: AddUploadRequest) => {
  const queryClient = useQueryClient();
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  return useMutation({
    mutationFn: () => addUploads(request),

    onSuccess: (data) => {
      const uploadCount = (request?.uploads?.length || 0) + (request?.artifacts?.length || 0);
      notify({
        variant: AlertVariant.success,
        title:
          uploadCount > 1
            ? `${uploadCount} rpms successfully uploaded to ${data.object_name}`
            : `One rpm successfully uploaded to ${data.object_name}`,
        description: 'This repository will be snapshotted shortly',
      });

      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Error uploading rpms to this repository',
        'An error occurred',
        err,
        'add-upload-error',
      );
    },
  });
};

export const useAddPopularRepositoryQuery = (
  queryClient: QueryClient,
  request: CreateContentRequest,
  page: number,
  perPage: number,
  filterData?: FilterData,
) => {
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  const popularRepositoriesKeyArray = [
    POPULAR_REPOSITORIES_LIST_KEY,
    page,
    perPage,
    undefined,
    ...Object.values(filterData || {}),
  ];
  const filteredRequest = request.filter((item) => !!item);
  return useMutation({
    mutationFn: () => AddContentListItems(filteredRequest),

    onMutate: async () => {
      const { name } = filteredRequest[0];
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: popularRepositoriesKeyArray,
      });
      // Snapshot the previous value
      const previousPopularData: Partial<PopularRepositoriesResponse> =
        queryClient.getQueryData(popularRepositoriesKeyArray) || {};

      queryClient.setQueryData(popularRepositoriesKeyArray, () => ({
        ...previousPopularData,
        data: previousPopularData.data?.map((data) => {
          if (name === data.suggested_name && !data.uuid) {
            return { ...data, uuid: 'temp', existing_name: name };
          }
          return data;
        }),
      }));
      return { previousData: previousPopularData };
    },

    onSuccess: (data: CreateContentRequestResponse) => {
      const hasPending = (data as ContentItem[]).some(({ status }) => status === 'Pending');
      notify({
        variant: AlertVariant.success,
        title: `Custom repository "${data?.[0]?.name}" added`,
        description: hasPending
          ? 'Repository introspection in progress'
          : 'Repository introspection data already available',
      });

      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [POPULAR_REPOSITORIES_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },

    onError: (err, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: PopularRepositoriesResponse;
        };
        queryClient.setQueryData(popularRepositoriesKeyArray, previousData);
      }
      errorNotifier(
        'Error adding item from popularRepo',
        'An error occurred',
        err,
        'add-popular-repo-error',
      );
    },
  });
};

export const useEditContentQuery = (request: EditContentRequestItem) => {
  const queryClient = useQueryClient();
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  return useMutation({
    mutationFn: () => EditContentListItem(request),

    onSuccess: () => {
      notify({
        variant: AlertVariant.success,
        title: `Successfully edited repository ${request.name}`,
      });

      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTENT_ITEM_KEY] });
      queryClient.invalidateQueries({ queryKey: [LIST_SNAPSHOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [POPULAR_REPOSITORIES_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Error editing items on content list',
        'An error occurred',
        err,
        'edit-content-error',
      );
    },
  });
};

export const useValidateContentList = () => {
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationFn: (request: ValidateContentRequestItem) => validateContentListItems(request),

    onError: (err) => {
      errorNotifier(
        'Error validating form fields',
        'An error occurred',
        err,
        'validate-content-error',
      );
    },
  });
};

export const useDeletePopularRepositoryMutate = (
  queryClient: QueryClient,
  page: number,
  perPage: number,
  filterData?: FilterData,
) => {
  const popularRepositoriesKeyArray = [
    POPULAR_REPOSITORIES_LIST_KEY,
    page,
    perPage,
    undefined,
    ...Object.values(filterData || {}),
  ];
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationFn: deleteContentListItem,
    onMutate: async (uuid: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: popularRepositoriesKeyArray,
      });
      // Snapshot the previous value
      const previousPopularData: Partial<PopularRepositoriesResponse> =
        queryClient.getQueryData(popularRepositoriesKeyArray) || {};

      queryClient.setQueryData(popularRepositoriesKeyArray, () => ({
        ...previousPopularData,
        data: previousPopularData.data?.map((data) => {
          if (data.uuid === uuid) {
            return { ...data, uuid: undefined };
          }
          return data;
        }),
      }));
      // Return a context object with the snapshotted value
      return { previousData: previousPopularData, queryClient };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [POPULAR_REPOSITORIES_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: PopularRepositoriesResponse;
        };
        queryClient.setQueryData(popularRepositoriesKeyArray, previousData);
      }
      errorNotifier(
        'Unable to delete the given repository.',
        'An error occurred',
        err,
        'delete-popular-repository-error',
      );
    },
  });
};

export const useDeleteContentItemMutate = (
  queryClient: QueryClient,
  page: number,
  perPage: number,
  contentOrigin: ContentOrigin[],
  filterData?: FilterData,
  sortString?: string,
) => {
  // Below MUST match the "useContentList" key found above or updates will fail.
  const contentListKeyArray = [
    CONTENT_LIST_KEY,
    buildContentListKey(page, perPage, sortString, contentOrigin, filterData),
  ];
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationFn: deleteContentListItem,
    onMutate: async (uuid: string) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: contentListKeyArray,
      });
      // Snapshot the previous value
      const previousData: Partial<ContentListResponse> =
        queryClient.getQueryData(contentListKeyArray) || {};

      // Optimistically update to the new value
      queryClient.setQueryData(contentListKeyArray, () => ({
        ...previousData,
        data: previousData.data?.filter((data) => uuid !== data.uuid),
        meta: previousData.meta
          ? {
              ...previousData.meta,
              count: previousData.meta.count ? previousData.meta.count - 1 : 1,
            }
          : undefined,
      }));
      // Return a context object with the snapshotted value
      return { previousData, queryClient };
    },
    onSuccess: (_data, _variables, context) => {
      // Update all of the existing calls "count" to prevent number jumping on pagination
      const { previousData } = context as {
        previousData: ContentListResponse;
      };
      queryClient.setQueriesData(
        { queryKey: [CONTENT_LIST_KEY] },
        (data: Partial<ContentListResponse> = {}) => {
          if (data?.meta?.count) {
            data.meta.count = previousData?.meta?.count - 1;
          }

          return data;
        },
      );
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [POPULAR_REPOSITORIES_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: ContentListResponse;
        };
        queryClient.setQueryData(contentListKeyArray, previousData);
      }
      errorNotifier(
        'Unable to delete the given repository.',
        'An error occurred',
        err,
        'delete-content-item-error',
      );
    },
  });
};

type DeletableItem = ContentItem | PopularRepository;

export const useBulkDeleteContentItemMutate = <T extends DeletableItem>(
  queryClient: QueryClient,
  selected: Map<string, T>,
  page: number,
  perPage: number,
  contentOrigin: ContentOrigin[],
  filterData?: FilterData,
  sortString?: string,
) => {
  // Below MUST match the "useContentList" key found above or updates will fail.
  const contentListKeyArray = [
    CONTENT_LIST_KEY,
    buildContentListKey(page, perPage, sortString, contentOrigin, filterData),
  ];
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationFn: (selected: Map<string, ContentItem>) => {
      const uuids = Array.from(selected.keys());
      return deleteContentListItems(uuids);
    },

    onMutate: async (selected: Map<string, ContentItem>) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: contentListKeyArray,
      });
      // Snapshot the previous value
      const previousData: Partial<ContentListResponse> =
        queryClient.getQueryData(contentListKeyArray) || {};

      const newMeta = previousData.meta
        ? {
            ...previousData.meta,
            count: previousData.meta.count ? previousData.meta.count - selected.size : 1,
          }
        : undefined;

      // Optimistically update to the new value
      queryClient.setQueryData(contentListKeyArray, () => ({
        ...previousData,
        data: previousData.data?.filter((data) => !selected.has(data.uuid)),
        meta: newMeta,
      }));
      // Return a context object with the snapshotted value
      return { previousData, newMeta, queryClient };
    },

    onSuccess: (_data, _variables, context) => {
      // Update all of the existing calls "count" to prevent number jumping on pagination
      const { newMeta } = context as {
        newMeta: Meta;
      };
      queryClient.setQueriesData(
        { queryKey: [CONTENT_LIST_KEY] },
        (data: Partial<ContentListResponse> = {}) => {
          if (data?.meta?.count) {
            data.meta.count = newMeta?.count;
          }
          return data;
        },
      );
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [POPULAR_REPOSITORIES_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err: { response?: { data: ErrorResponse } }, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: ContentListResponse;
        };
        queryClient.setQueryData(contentListKeyArray, previousData);
      }
      errorNotifier(
        'Error deleting items from content list',
        'An error occurred',
        err,
        'bulk-delete-error',
      );
    },
  });
};

export const useGetSnapshotsByDates = (uuids: string[], date: string) => {
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationFn: () => getSnapshotsByDate(uuids, date),

    onError: (err) => {
      errorNotifier(
        'Error deleting items from content list',
        'An error occurred',
        err,
        'snapshot-by-date-error',
      );
    },
  });
};

export const useRepositoryParams = () =>
  useQuery({
    queryKey: [REPOSITORY_PARAMS_KEY],
    queryFn: getRepositoryParams,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

export const useFetchGpgKey = () => {
  const errorNotifier = useErrorNotification();
  const [isLoading, setIsLoading] = useState(false);

  const fetchGpgKey = async (url: string): Promise<string> => {
    setIsLoading(true);
    let gpg_key = url;
    try {
      const data = await getGpgKey(url);
      gpg_key = data.gpg_key;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      errorNotifier(
        'Error fetching GPG key from provided URL',
        'An error occurred',
        err,
        'fetch-gpgkey-error',
      );
    }
    setIsLoading(false);
    return gpg_key;
  };

  return { fetchGpgKey, isLoading };
};

export const useGetSnapshotList = (uuid: string, page: number, limit: number, sortBy: string) =>
  useQuery({
    queryKey: [LIST_SNAPSHOTS_KEY, uuid, page, limit, sortBy],
    queryFn: () => getSnapshotList(uuid, page, limit, sortBy),
    placeholderData: keepPreviousData,
    staleTime: 60000,
    meta: {
      title: 'Unable to find snapshots with the given UUID.',
      id: 'snapshot-list-error',
    },
  });

export const useGetPackagesQuery = (
  uuid: string,
  page: number,
  limit: number,
  searchQuery: string,
  sortBy?: string,
) =>
  useQuery({
    queryKey: [PACKAGES_KEY, uuid, page, limit, searchQuery, sortBy],
    queryFn: () => getPackages(uuid, page, limit, searchQuery, sortBy),
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
    staleTime: 60000,
    meta: {
      title: 'Unable to find packages with the given UUID.',
      id: 'packages-list-error',
    },
  });

export const useLightwellRepositoryPackagesQuery = (
  uuid: string,
  page: number,
  limit: number,
  search = '',
  enabled = true,
) =>
  useQuery({
    queryKey: [LIGHTWELL_REPOSITORY_PACKAGES_KEY, uuid, page, limit, search],
    queryFn: () => getLightwellRepositoryPackages(uuid, page, limit, search),
    placeholderData: keepPreviousData,
    staleTime: 60000,
    enabled: enabled && !!uuid,
    meta: {
      title: 'Unable to find packages for the repository.',
      id: 'lightwell-repository-packages-list-error',
    },
  });

export const useMavenPackageDetailQuery = (
  uuid: string,
  group: string,
  name: string,
  version: string,
  enabled = true,
) =>
  useQuery({
    queryKey: [MAVEN_PACKAGE_DETAIL_KEY, uuid, group, name, version],
    queryFn: () => getMavenPackageDetail(uuid, group, name, version),
    staleTime: 60000,
    enabled: enabled && !!uuid && !!group && !!name && !!version,
    meta: {
      title: 'Unable to load package details.',
      id: 'maven-package-detail-error',
    },
  });

export const useMavenPackageVersionsPreload = (
  uuid: string,
  group: string,
  name: string,
  versions: string[],
  enabled = true,
) =>
  useQueries({
    queries: versions.map((version) => ({
      queryKey: [MAVEN_PACKAGE_DETAIL_KEY, uuid, group, name, version],
      queryFn: () => getMavenPackageDetail(uuid, group, name, version),
      staleTime: 60000,
      enabled: enabled && !!uuid && !!group && !!name && !!version,
      meta: {
        title: 'Unable to load package details.',
        id: 'maven-package-detail-error',
      },
    })),
  });

export const useMavenPackageVersionsListQuery = (
  uuid: string,
  group: string,
  name: string,
  enabled = true,
) =>
  useQuery({
    queryKey: [MAVEN_PACKAGE_VERSIONS_LIST_KEY, uuid, group, name],
    queryFn: () => getMavenPackageVersionsList(uuid, group, name),
    staleTime: 60000,
    enabled: enabled && !!uuid && !!group && !!name,
    meta: {
      title: 'Unable to load package versions.',
      id: 'maven-package-versions-list-error',
    },
  });

export const usePythonPackageDetailQuery = (
  uuid: string,
  name: string,
  version: string,
  enabled = true,
) =>
  useQuery({
    queryKey: [PYTHON_PACKAGE_DETAIL_KEY, uuid, name, version],
    queryFn: () => getPythonPackageDetail(uuid, name, version),
    staleTime: 60000,
    placeholderData: keepPreviousData,
    enabled: enabled && !!uuid && !!name && !!version,
    meta: {
      title: 'Unable to load package details.',
      id: 'python-package-detail-error',
    },
  });

export const usePythonPackageVersionsQuery = (uuid: string, name: string, enabled = true) =>
  useQuery({
    queryKey: [PYTHON_PACKAGE_VERSIONS_KEY, uuid, name],
    queryFn: () => getPythonPackageVersions(uuid, name),
    staleTime: 60000,
    enabled: enabled && !!uuid && !!name,
    meta: {
      title: 'Unable to load package versions.',
      id: 'python-package-versions-error',
    },
  });

export const useGetSnapshotPackagesQuery = (
  snap_uuid: string,
  page: number,
  limit: number,
  searchQuery: string,
) =>
  useQuery({
    queryKey: [SNAPSHOT_PACKAGES_KEY, snap_uuid, page, limit, searchQuery],
    queryFn: () => getSnapshotPackages(snap_uuid, page, limit, searchQuery),
    placeholderData: keepPreviousData,
    staleTime: 60000,
    meta: {
      title: 'Unable to find packages with the given UUID.',
      id: 'snapshot-package-list-error',
    },
  });

export const useGetSnapshotErrataQuery = (
  snap_uuid: string,
  page: number,
  limit: number,
  search: string,
  type: string[],
  severity: string[],
  sortBy: string,
) =>
  useQuery({
    queryKey: [SNAPSHOT_ERRATA_KEY, snap_uuid, page, limit, search, type, severity, sortBy],
    queryFn: () => getSnapshotErrata(snap_uuid, page, limit, search, type, severity, sortBy),
    placeholderData: keepPreviousData,
    staleTime: 60000,
    meta: {
      title: 'Unable to find errata with the given UUID.',
      id: 'snapshot-errata-list-error',
    },
  });

export const useTriggerSnapshot = (queryClient: QueryClient) => {
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  return useMutation({
    mutationFn: triggerSnapshot,
    onSuccess: () => {
      notify({
        variant: AlertVariant.success,
        title: 'Snapshot triggered successfully',
      });
      queryClient.invalidateQueries({ queryKey: [LIST_SNAPSHOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },
    onError: (err) => {
      errorNotifier(
        'Error triggering snapshot',
        'An error occurred',
        err,
        'trigger-snapshot-error',
      );
    },
  });
};

export const useIntrospectRepositoryMutate = (
  queryClient: QueryClient,
  page: number,
  perPage: number,
  contentOrigin: ContentOrigin[],
  filterData?: FilterData,
  sortString?: string,
) => {
  // Below MUST match the "useContentList" key found above or updates will fail.
  const contentListKeyArray = [
    CONTENT_LIST_KEY,
    buildContentListKey(page, perPage, sortString, contentOrigin, filterData),
  ];
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();
  let hasSnapshottingEnabled: boolean | undefined = false;
  return useMutation({
    mutationFn: introspectRepository,
    onMutate: async (item: IntrospectRepositoryRequestItem) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: contentListKeyArray,
      });
      // Snapshot the previous value
      const previousData: Partial<ContentListResponse> =
        queryClient.getQueryData(contentListKeyArray) || {};

      const previousStatus = previousData.data?.find((data) => item.uuid == data.uuid)?.status;
      const newData = cloneDeep(previousData);
      if (previousStatus) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newData.data.filter((data) => item.uuid == data.uuid).at(0).status = 'Pending';
      }

      // Optimistically update to the new value
      queryClient.setQueryData(contentListKeyArray, () => ({
        ...newData,
      }));

      hasSnapshottingEnabled = newData.data?.at(0)?.snapshot;
      // Return a context object with the snapshotted value
      return { previousData, queryClient };
    },
    onSuccess: () => {
      if (!hasSnapshottingEnabled) {
        notify({
          variant: AlertVariant.success,
          title: 'Repository introspection in progress',
        });
      }
      queryClient.invalidateQueries({ queryKey: [CONTENT_ITEM_KEY] });
      queryClient.invalidateQueries({ queryKey: [LIST_SNAPSHOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: ContentListResponse;
        };
        queryClient.setQueryData(contentListKeyArray, previousData);
      }
      errorNotifier(
        'Error introspecting repository',
        'An error occurred',
        err,
        'introspect-repository-error',
      );
    },
  });
};

export const useGetRepoConfigFileQuery = (repo_uuid: string, snapshot_uuid: string) => {
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationKey: [REPO_CONFIG_FILE_KEY, repo_uuid, snapshot_uuid],
    mutationFn: async () => await getRepoConfigFile(snapshot_uuid),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Unable to find config.repo with the given UUID.',
        'An error occurred',
        err,
        'repo-config-error',
      );
    },
  });
};

export const useGetLatestRepoConfigFileQuery = (repo_uuid: string) => {
  const errorNotifier = useErrorNotification();
  return useMutation({
    mutationKey: [LATEST_REPO_CONFIG_FILE_KEY, repo_uuid],
    mutationFn: async () => await getLatestRepoConfigFile(repo_uuid),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      errorNotifier(
        'Unable to find config.repo with the given UUID.',
        'An error occurred',
        err,
        'repo-config-error',
      );
    },
  });
};

export const useBulkDeleteSnapshotsMutate = (
  queryClient: QueryClient,
  repoUuid: string,
  selected: Set<string>,
) => {
  const uuids = Array.from(selected);
  const snapshotListKeyArray = [LIST_SNAPSHOTS_KEY, repoUuid];
  const errorNotifier = useErrorNotification();

  return useMutation({
    mutationFn: () => deleteSnapshots(repoUuid, uuids),

    onMutate: async (checkedSnapshots: Set<string>) => {
      await queryClient.cancelQueries({
        queryKey: snapshotListKeyArray,
      });
      const previousData: Partial<SnapshotListResponse> =
        queryClient.getQueryData(snapshotListKeyArray) || {};

      const newMeta = previousData.meta
        ? {
            ...previousData.meta,
            count: previousData.meta.count ? previousData.meta.count - checkedSnapshots.size : 1,
          }
        : undefined;

      queryClient.setQueryData(snapshotListKeyArray, () => ({
        ...previousData,
        data: previousData.data?.filter((data) => !checkedSnapshots.has(data.uuid)),
        meta: newMeta,
      }));
      return { previousData, newMeta, queryClient };
    },

    onSuccess: (_data, _variables, context) => {
      const { newMeta } = context as {
        newMeta: Meta;
      };
      queryClient.setQueriesData(
        { queryKey: [LIST_SNAPSHOTS_KEY] },
        (data: Partial<SnapshotListResponse> = {}) => {
          if (data?.meta?.count) {
            data.meta.count = newMeta?.count;
          }
          return data;
        },
      );
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATES_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_TASK_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATE_SNAPSHOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_FOR_SNAPSHOTS] });
      queryClient.invalidateQueries({ queryKey: [TEMPLATE_ERRATA_KEY] });
      queryClient.invalidateQueries({ queryKey: [GET_TEMPLATE_PACKAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [LIST_SNAPSHOTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [SNAPSHOT_ERRATA_KEY] });
      queryClient.invalidateQueries({ queryKey: [SNAPSHOT_PACKAGES_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_CONFIG_FILE_KEY] });
      queryClient.invalidateQueries({ queryKey: [LATEST_REPO_CONFIG_FILE_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },

    onError: (err: { response?: { data: ErrorResponse } }, _newData, context) => {
      if (context) {
        const { previousData } = context as {
          previousData: SnapshotListResponse;
        };
        queryClient.setQueryData(snapshotListKeyArray, previousData);
      }
      errorNotifier(
        'Error deleting snapshot from the snapshot list',
        'An error occured',
        err,
        'bulk-delete-error',
      );
    },
  });
};

export const useBulkRemoveRepositoryRpmsMutate = (queryClient: QueryClient, repoUuid: string) => {
  const errorNotifier = useErrorNotification();
  const { notify } = useNotification();

  return useMutation({
    mutationFn: (uuids: string[]) => bulkRemoveRepositoryRpms(repoUuid, uuids),
    onSuccess: (_data, uuids) => {
      notify({
        variant: AlertVariant.success,
        title:
          uuids.length === 1
            ? 'The package was successfully removed from the repository.'
            : `${uuids.length} packages were successfully removed from the repository.`,
      });
      queryClient.invalidateQueries({ queryKey: [PACKAGES_KEY, repoUuid] });
      queryClient.invalidateQueries({ queryKey: [CONTENT_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTENT_ITEM_KEY, repoUuid] });
      queryClient.invalidateQueries({ queryKey: [REPO_COUNT_KEY] });
    },
    onError: (err) => {
      errorNotifier(
        'Error removing packages from the repository',
        'An error occurred',
        err,
        'bulk-remove-rpms-error',
      );
    },
  });
};
