import { fireEvent, render } from '@testing-library/react';
import { RepositoriesCard } from './RepositoriesCard';
import { useCountEachRepositoryType } from 'Hooks/useCountEachRepositoryType';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';

jest.mock('Hooks/useCountEachRepositoryType', () => ({
  useCountEachRepositoryType: jest.fn(),
}));

jest.mock('Hooks/navigation/useNavigateTo', () => ({
  useNavigateTo: jest.fn(() => jest.fn()),
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: jest.fn(),
}));

import { useAppContext } from 'middleware/AppContext';

beforeEach(() => {
  jest.clearAllMocks();
  (useCountEachRepositoryType as jest.Mock).mockReturnValue({
    redhatCount: 15,
    partnerCount: 8,
    customCount: 3,
    isLoading: false,
  });
  (useAppContext as jest.Mock).mockReturnValue({
    features: {},
  });
});

describe('RepositoriesCard', () => {
  it('renders all positive counts correctly', () => {
    const { getByText } = render(<RepositoriesCard />);

    expect(getByText('15')).toBeInTheDocument();
    expect(getByText('Red Hat repositories')).toBeInTheDocument();
    expect(getByText('8')).toBeInTheDocument();
    expect(getByText('Community repositories')).toBeInTheDocument();
    expect(getByText('3')).toBeInTheDocument();
    expect(getByText('Custom repositories')).toBeInTheDocument();
  });

  it('renders the card title', () => {
    const { getByText } = render(<RepositoriesCard />);

    expect(getByText('Available repositories')).toBeInTheDocument();
  });

  it('renders the Manage Repositories button', () => {
    const { getByText } = render(<RepositoriesCard />);

    expect(getByText('Manage repositories')).toBeInTheDocument();
  });

  it('calls useNavigateTo for each repository type and the manage button', () => {
    render(<RepositoriesCard />);

    expect(useNavigateTo).toHaveBeenCalledWith('redHatRepositories');
    expect(useNavigateTo).toHaveBeenCalledWith('partnerRepositories');
    expect(useNavigateTo).toHaveBeenCalledWith('customRepositories');
    expect(useNavigateTo).toHaveBeenCalledWith('allRepositories');
  });

  it('navigates to Red Hat repositories when clicking the Red Hat link', () => {
    const mockRedHatNavigate = jest.fn();
    (useNavigateTo as jest.Mock).mockImplementation((key) =>
      key === 'redHatRepositories' ? mockRedHatNavigate : jest.fn(),
    );

    const { getByText } = render(<RepositoriesCard />);
    fireEvent.click(getByText('Red Hat repositories'));

    expect(mockRedHatNavigate).toHaveBeenCalled();
  });

  it('navigates to Community repositories when clicking the Community link', () => {
    const mockPartnerNavigate = jest.fn();
    (useNavigateTo as jest.Mock).mockImplementation((key) =>
      key === 'partnerRepositories' ? mockPartnerNavigate : jest.fn(),
    );

    const { getByText } = render(<RepositoriesCard />);
    fireEvent.click(getByText('Community repositories'));

    expect(mockPartnerNavigate).toHaveBeenCalled();
  });

  it('navigates to Custom repositories when clicking the Custom link', () => {
    const mockCustomNavigate = jest.fn();
    (useNavigateTo as jest.Mock).mockImplementation((key) =>
      key === 'customRepositories' ? mockCustomNavigate : jest.fn(),
    );

    const { getByText } = render(<RepositoriesCard />);
    fireEvent.click(getByText('Custom repositories'));

    expect(mockCustomNavigate).toHaveBeenCalled();
  });

  it('navigates to all repositories when clicking Manage repositories', () => {
    const mockAllNavigate = jest.fn();
    (useNavigateTo as jest.Mock).mockImplementation((key) =>
      key === 'allRepositories' ? mockAllNavigate : jest.fn(),
    );

    const { getByText } = render(<RepositoriesCard />);
    fireEvent.click(getByText('Manage repositories'));

    expect(mockAllNavigate).toHaveBeenCalled();
  });

  it('renders skeleton placeholders while loading', () => {
    (useCountEachRepositoryType as jest.Mock).mockReturnValue({
      redhatCount: 0,
      partnerCount: 0,
      customCount: 0,
      isLoading: true,
    });

    const { queryByText, getAllByRole } = render(<RepositoriesCard />);

    expect(queryByText('Red Hat repositories')).not.toBeInTheDocument();
    expect(queryByText('Community repositories')).not.toBeInTheDocument();
    expect(queryByText('Custom repositories')).not.toBeInTheDocument();
    expect(getAllByRole('progressbar')).toHaveLength(3);
  });
});
