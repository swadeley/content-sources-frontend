import { render } from '@testing-library/react';
import { testRepositoryParamsResponse } from 'testingHelpers';
import TemplateFilters from './TemplateFilters';
import { useQueryClient } from 'react-query';
import userEvent from '@testing-library/user-event';

jest.mock('middleware/AppContext', () => ({
  useAppContext: () => ({}),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('react-query');

beforeAll(() => {
  (useQueryClient as jest.Mock).mockImplementation(() => ({
    getQueryData: () => testRepositoryParamsResponse,
  }));
});

it('Render loading state (disabled)', async () => {
  const { getByRole } = render(
    <TemplateFilters
      isLoading={true}
      setFilterData={() => null}
      filterData={{
        search: '',
        version: '',
        arch: '',
        repository_uuids: '',
        snapshot_uuids: '',
      }}
    />,
  );

  const filterInput = getByRole('button', { name: 'filterSelectionDropdown' });
  expect(filterInput).toHaveAttribute('disabled');
});

it('Select a filter of each type and ensure chips are present ContentListFilters', async () => {
  const { queryByText, getByRole, getByLabelText, queryAllByText, getByText } = render(
    <TemplateFilters
      setFilterData={() => null}
      filterData={{
        search: '',
        version: '',
        arch: '',
        repository_uuids: '',
        snapshot_uuids: '',
      }}
    />,
  );

  const filterInput = getByRole('searchbox', { name: '' });
  expect(filterInput).not.toHaveAttribute('disabled');

  await userEvent.type(filterInput, 'EPEL');
  expect(filterInput).toHaveValue('EPEL');

  const optionMenu = getByRole('button', { name: 'filterSelectionDropdown' });

  await userEvent.click(optionMenu);

  // Select a Version item
  const versionOption = getByText('OS version')?.closest('button') as Element;

  expect(versionOption).toBeInTheDocument();
  await userEvent.click(versionOption);

  const versionSelector = getByLabelText('filter OS version') as Element;
  expect(versionSelector).toBeInTheDocument();
  await userEvent.click(versionSelector);

  const versionItem = getByRole('menuitem', { name: 'el7' }) as Element;
  expect(versionItem).toBeInTheDocument();
  await userEvent.click(versionItem);

  await userEvent.click(optionMenu);

  // Select an architecture item
  const archOption = queryByText('Architecture') as Element;
  expect(archOption).toBeInTheDocument();
  await userEvent.click(archOption);

  const archSelector = getByLabelText('filter architecture') as Element;
  expect(archSelector).toBeInTheDocument();
  await userEvent.click(archSelector);

  const archItem = queryByText('aarch64') as Element;
  expect(archItem).toBeInTheDocument();
  await userEvent.click(archItem);

  // Check all the chips are there
  expect(queryByText('el7')).toBeInTheDocument();
  expect(queryAllByText('aarch64')).toHaveLength(3);
  expect(queryByText('EPEL')).toBeInTheDocument();
});
