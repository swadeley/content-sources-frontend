import { render, screen } from '@testing-library/react';
import SnapshotListModal from './SnapshotListModal';
import {
  ReactQueryTestWrapper,
  defaultContentItemWithSnapshot,
  defaultMetaItem,
  defaultSnapshotItem,
} from 'testingHelpers';
import { useFetchContent, useGetSnapshotList } from 'services/Content/ContentQueries';
import { ContentOrigin } from 'services/Content/ContentApi';

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('services/Content/ContentQueries', () => ({
  useFetchContent: jest.fn(),
  useGetSnapshotList: jest.fn(),
  useGetRepoConfigFileQuery: () => ({ mutateAsync: jest.fn() }),
  useGetLatestRepoConfigFileQuery: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  Outlet: () => <></>,
  useOutletContext: jest.fn(),
  useParams: () => ({
    repoUUID: 'some-uuid',
  }),
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({
    rbac: { repoRead: true, repoWrite: true },
    contentOrigin: [ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD],
    features: {
      snapshots: { enabled: true, accessible: true },
      adminpartnerrepositories: { enabled: true, accessible: true },
    },
    setContentOrigin: jest.fn(),
  }),
}));

it('Render 1 item', () => {
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: defaultMetaItem,
      data: [defaultSnapshotItem],
    },
    isLoading: false,
    isFetching: false,
  }));
  const { getByText } = render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('View list of snapshots for AwesomeNamewwyylse12.')).toBeInTheDocument();
  expect(
    getByText((defaultSnapshotItem.content_counts['rpm.package'] as number)?.toString()),
  ).toBeInTheDocument();
});

it('Render 20 items', () => {
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: { ...defaultMetaItem, count: 21 },
      data: Array(20)
        .fill(defaultSnapshotItem)
        .map((val, index) => ({
          ...val,
          uuid: `${val.uuid}-${index}`,
          content_counts: {
            ...val.content_counts,
            'rpm.package': val.content_counts['rpm.package'] + index,
          },
        })),
    },
    isLoading: false,
    isFetching: false,
  }));

  const { getByText } = render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('View list of snapshots for AwesomeNamewwyylse12.')).toBeInTheDocument();
  expect(
    getByText((defaultSnapshotItem.content_counts['rpm.package'] as number)?.toString()),
  ).toBeInTheDocument();
});

it('Render loading state', () => {
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: undefined,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: undefined,
    isLoading: true,
    isFetching: true,
  }));

  const { getByText, getAllByText } = render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(getAllByText('Snapshots').length).toBeGreaterThanOrEqual(1);
  expect(getByText('View list of snapshots for a repository.')).toBeInTheDocument();
});

it('Render empty state', () => {
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: { ...defaultMetaItem, count: 0 },
      data: [],
    },
    isLoading: false,
    isFetching: false,
  }));

  const { getByText } = render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(getByText('No snapshots')).toBeInTheDocument();
  expect(getByText('No snapshots have been taken for this repository yet.')).toBeInTheDocument();
});

it('Shows Published label when snapshot is published', () => {
  const publishedSnapshot = {
    ...defaultSnapshotItem,
    published: true,
    publish_task: { status: 'completed' },
  };
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: { ...defaultContentItemWithSnapshot, partner: true },
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: defaultMetaItem,
      data: [publishedSnapshot],
    },
    isLoading: false,
    isFetching: false,
  }));

  render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(screen.getByText('Published')).toBeInTheDocument();
});

it('Shows Publishing in progress label when publish task is in progress', () => {
  const publishingSnapshot = {
    ...defaultSnapshotItem,
    published: true,
    publish_task: { status: 'running' },
  };
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: { ...defaultContentItemWithSnapshot, partner: true },
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: defaultMetaItem,
      data: [publishingSnapshot],
    },
    isLoading: false,
    isFetching: false,
  }));

  render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(screen.getByText('Publishing in progress')).toBeInTheDocument();
});

it('Shows no publish label when snapshot is not published', () => {
  const unpublishedSnapshot = { ...defaultSnapshotItem, published: false };
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: defaultContentItemWithSnapshot,
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: defaultMetaItem,
      data: [unpublishedSnapshot],
    },
    isLoading: false,
    isFetching: false,
  }));

  render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(screen.queryByText('Published')).not.toBeInTheDocument();
  expect(screen.queryByText('Publishing in progress')).not.toBeInTheDocument();
});

it('Hides publish actions when repository is not a partner', () => {
  (useFetchContent as jest.Mock).mockImplementation(() => ({
    data: { ...defaultContentItemWithSnapshot, partner: false },
  }));
  (useGetSnapshotList as jest.Mock).mockImplementation(() => ({
    data: {
      meta: { ...defaultMetaItem, count: 2 },
      data: [defaultSnapshotItem, { ...defaultSnapshotItem, uuid: 'snap-2' }],
    },
    isLoading: false,
    isFetching: false,
  }));

  render(
    <ReactQueryTestWrapper>
      <SnapshotListModal />
    </ReactQueryTestWrapper>,
  );

  expect(screen.queryByText('Publish')).not.toBeInTheDocument();
  expect(screen.queryByText('Unpublish')).not.toBeInTheDocument();
});
