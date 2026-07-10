import { fireEvent, render, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import TemplatesTable from './TemplatesTable';
import { useTemplateList } from 'services/Templates/TemplateQueries';
import { useTemplateSystemCounts } from 'services/Systems/SystemsQueries';
import { ReactQueryTestWrapper, defaultTemplateItem } from 'testingHelpers';
import { formatDateDDMMMYYYY } from 'helpers';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { COPY_ROUTE, DELETE_ROUTE, EDIT_ROUTE } from 'Routes/constants';

const mockNavigate = jest.fn();

jest.mock('services/Templates/TemplateQueries', () => ({
  useTemplateList: jest.fn(),
  useDeleteTemplateItemMutate: () => ({ mutate: () => undefined, isLoading: false }),
}));

jest.mock('services/Systems/SystemsQueries', () => ({
  useTemplateSystemCounts: jest.fn(),
}));

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({}),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn().mockReturnValue({}),
  Outlet: () => <></>,
}));

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({
    rbac: { repoWrite: true, templateRead: true, templateWrite: true },
    subscriptions: { red_hat_enterprise_linux: true },
    setContentOrigin: () => {},
  }),
}));

jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: jest.fn(),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(),
}));

(useChrome as jest.Mock).mockImplementation(() => ({
  getEnvironment: () => 'stage',
}));

beforeEach(() => {
  mockNavigate.mockClear();
  (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
});

const mockSystemCountsDefault = () => {
  (useTemplateSystemCounts as jest.Mock).mockImplementation(() => ({
    data: {},
    isFetching: false,
  }));
};

it('expect TemplatesTable to render empty state', () => {
  (useTemplateList as jest.Mock).mockImplementation(() => ({
    isLoading: false,
  }));
  mockSystemCountsDefault();

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <TemplatesTable />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('No templates')).toBeInTheDocument();
  expect(
    queryByText(
      'Control the scope of packages and advisory updates to be installed on selected systems with templates. To get started, create a template.',
    ),
  ).toBeInTheDocument();
});

it('expect TemplatesTable to render a single row', () => {
  (useTemplateList as jest.Mock).mockImplementation(() => ({
    data: {
      data: [defaultTemplateItem],
      meta: { limit: 10, offset: 0, count: 1 },
      isLoading: false,
    },
  }));
  mockSystemCountsDefault();

  const { queryByText } = render(
    <ReactQueryTestWrapper>
      <TemplatesTable />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText(defaultTemplateItem.name)).toBeInTheDocument();
  expect(queryByText(formatDateDDMMMYYYY(defaultTemplateItem.date))).toBeInTheDocument();
});

it('expect TemplatesTable to render all action items', async () => {
  (useTemplateList as jest.Mock).mockImplementation(() => ({
    data: {
      data: [defaultTemplateItem],
      meta: { limit: 10, offset: 0, count: 1 },
      isLoading: false,
    },
  }));
  mockSystemCountsDefault();

  const { getByRole, queryByText } = render(
    <ReactQueryTestWrapper>
      <TemplatesTable />
    </ReactQueryTestWrapper>,
  );

  fireEvent.click(getByRole('button', { name: 'Kebab toggle' }));
  await waitFor(() => {
    expect(queryByText('Edit')).toBeInTheDocument();
    expect(queryByText('Copy')).toBeInTheDocument();
    expect(queryByText('Delete')).toBeInTheDocument();
  });
});

describe('TemplatesTable action navigation', () => {
  const renderTableWithRow = () => {
    (useTemplateList as jest.Mock).mockImplementation(() => ({
      data: {
        data: [defaultTemplateItem],
        meta: { limit: 10, offset: 0, count: 1 },
        isLoading: false,
      },
    }));
    mockSystemCountsDefault();

    const view = render(
      <ReactQueryTestWrapper>
        <TemplatesTable />
      </ReactQueryTestWrapper>,
    );

    fireEvent.click(view.getByRole('button', { name: 'Kebab toggle' }));

    return view;
  };

  it('navigates to edit route with table state', async () => {
    const { queryByText } = renderTableWithRow();

    await waitFor(() => expect(queryByText('Edit')).toBeInTheDocument());
    fireEvent.click(queryByText('Edit') as Element);

    expect(mockNavigate).toHaveBeenCalledWith(`${EDIT_ROUTE}/${defaultTemplateItem.uuid}`, {
      state: { from: 'table' },
    });
  });

  it('navigates to copy route with table state', async () => {
    const { queryByText } = renderTableWithRow();

    await waitFor(() => expect(queryByText('Copy')).toBeInTheDocument());
    fireEvent.click(queryByText('Copy') as Element);

    expect(mockNavigate).toHaveBeenCalledWith(`${COPY_ROUTE}/${defaultTemplateItem.uuid}`, {
      state: { from: 'table' },
    });
  });

  it('navigates to delete route from table', async () => {
    const { queryByText } = renderTableWithRow();

    await waitFor(() => expect(queryByText('Delete')).toBeInTheDocument());
    fireEvent.click(queryByText('Delete') as Element);

    expect(mockNavigate).toHaveBeenCalledWith(`${DELETE_ROUTE}/${defaultTemplateItem.uuid}`);
  });
});

it('expect TemplatesTable to display the system count for a template', () => {
  (useTemplateList as jest.Mock).mockImplementation(() => ({
    data: {
      data: [defaultTemplateItem],
      meta: { limit: 10, offset: 0, count: 1 },
      isLoading: false,
    },
  }));
  (useTemplateSystemCounts as jest.Mock).mockImplementation(() => ({
    data: { [defaultTemplateItem.uuid]: 5 },
    isFetching: false,
  }));

  const { queryByText, getByRole } = render(
    <ReactQueryTestWrapper>
      <TemplatesTable />
    </ReactQueryTestWrapper>,
  );

  expect(queryByText('Systems')).toBeInTheDocument();
  const systemCountLink = getByRole('button', { name: '5' });
  expect(systemCountLink).toBeInTheDocument();
});

it('expect TemplatesTable to show 0 when system count is not available', () => {
  (useTemplateList as jest.Mock).mockImplementation(() => ({
    data: {
      data: [defaultTemplateItem],
      meta: { limit: 10, offset: 0, count: 1 },
      isLoading: false,
    },
  }));
  (useTemplateSystemCounts as jest.Mock).mockImplementation(() => ({
    data: {},
    isFetching: false,
  }));

  const { getByRole } = render(
    <ReactQueryTestWrapper>
      <TemplatesTable />
    </ReactQueryTestWrapper>,
  );

  const systemCountLink = getByRole('button', { name: '0' });
  expect(systemCountLink).toBeInTheDocument();
});

it('expect TemplatesTable to show a spinner while system counts are loading', () => {
  (useTemplateList as jest.Mock).mockImplementation(() => ({
    data: {
      data: [defaultTemplateItem],
      meta: { limit: 10, offset: 0, count: 1 },
      isLoading: false,
    },
  }));
  (useTemplateSystemCounts as jest.Mock).mockImplementation(() => ({
    data: undefined,
    isFetching: true,
  }));

  const { queryByRole } = render(
    <ReactQueryTestWrapper>
      <TemplatesTable />
    </ReactQueryTestWrapper>,
  );

  // Should not show a count link while loading
  expect(queryByRole('button', { name: '0' })).not.toBeInTheDocument();
});
