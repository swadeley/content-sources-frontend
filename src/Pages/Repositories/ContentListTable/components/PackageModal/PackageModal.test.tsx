import { render } from '@testing-library/react';
import PackageModal from './PackageModal';
import { defaultPackageItem, ReactQueryTestWrapper } from 'testingHelpers';
import { useFetchContent, useGetPackagesQuery } from 'services/Content/ContentQueries';
import { ContentOrigin } from 'services/Content/ContentApi';

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('services/Content/ContentQueries', () => ({
  useGetPackagesQuery: jest.fn(),
  useFetchContent: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: () => ({
    repoUUID: 'some-uuid',
  }),
  Outlet: () => null,
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({ rbac: { read: true, write: true } }),
  contentOrigin: [],
}));

const basePackagesQueryResult = {
  isLoading: false,
  isFetching: false,
  isError: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useFetchContent as jest.Mock).mockReturnValue({
    data: { origin: ContentOrigin.EXTERNAL },
    isError: false,
  });
});

it('Render 1 item', () => {
  (useGetPackagesQuery as jest.Mock).mockImplementation(() => ({
    ...basePackagesQueryResult,
    data: {
      data: [defaultPackageItem],
      meta: { count: 1, limit: 20, offset: 0 },
    },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <PackageModal />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('Packages in the latest snapshot')).toBeInTheDocument();
  expect(queryByText(defaultPackageItem.name)).toBeInTheDocument();
  expect(queryByText(defaultPackageItem.version)).toBeInTheDocument();
  expect(queryByText(defaultPackageItem.release)).toBeInTheDocument();
  expect(queryByText(defaultPackageItem.arch)).toBeInTheDocument();
  expect(queryByText('Clear search')).not.toBeInTheDocument();
});

it('Render with no packages (after an unsuccessful search)', () => {
  (useGetPackagesQuery as jest.Mock).mockImplementation(() => ({
    ...basePackagesQueryResult,
    data: {
      data: [],
      meta: { count: 0, limit: 20, offset: 0 },
    },
  }));

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <PackageModal />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('Packages in the latest snapshot')).toBeInTheDocument();
  expect(
    queryByText('You may need to add repositories that contain packages.'),
  ).toBeInTheDocument();
});
