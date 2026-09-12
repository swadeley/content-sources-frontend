import { render, screen } from '@testing-library/react';
import { ReactQueryTestWrapper } from 'testingHelpers';
import PublishSnapshotModal from './PublishSnapshotModal';

const mockNavigate = jest.fn();
const mockMutateAsync = jest.fn(() => Promise.resolve());
const mockUseLocation = jest.fn<Partial<Location>, []>(() => ({
  search: '?snapshotUUID=snap-123',
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
  useParams: () => ({ repoUUID: 'repo-123' }),
}));

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('services/AdminPartnerRepos/AdminPartnerReposQueries', () => ({
  usePublishSnapshotMutate: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({
    rbac: { repoRead: true, repoWrite: true },
    features: { snapshots: { enabled: true, accessible: true } },
    contentOrigin: [],
    setContentOrigin: jest.fn(),
  }),
}));

it('renders publish modal with correct title', () => {
  render(
    <ReactQueryTestWrapper>
      <PublishSnapshotModal />
    </ReactQueryTestWrapper>,
  );

  expect(screen.getByText('Publish snapshot?')).toBeInTheDocument();
  expect(screen.getByText('Publish')).toBeInTheDocument();
  expect(screen.getByText('Cancel')).toBeInTheDocument();
});

it('renders unpublish modal when action=unpublish in URL', () => {
  mockUseLocation.mockReturnValue({
    search: '?snapshotUUID=snap-123&action=unpublish',
    pathname: '',
    hash: '',
  });

  render(
    <ReactQueryTestWrapper>
      <PublishSnapshotModal />
    </ReactQueryTestWrapper>,
  );

  expect(screen.getByText('Unpublish snapshot?')).toBeInTheDocument();
  expect(screen.getByText('Unpublish')).toBeInTheDocument();
});
