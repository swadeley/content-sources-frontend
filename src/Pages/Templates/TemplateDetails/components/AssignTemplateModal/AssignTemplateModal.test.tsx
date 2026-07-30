import { render, waitFor, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AssignTemplateModal from './AssignTemplateModal';
import type { SystemItem } from 'services/Systems/SystemsApi';
import { TemplateItem } from '../../../../../services/Templates/TemplateApi';
import { useSystemsListQuery } from 'services/Systems/SystemsQueries';
import useCompatibleSystems from 'Hooks/useCompatibleSystems';
import { useFetchTemplate } from '../../../../../services/Templates/TemplateQueries';
import {
  defaultSystemsListItem,
  versionLockedSystemsListItem,
  satelliteManagedSystemsListItem,
  defaultEUSupportTemplateItem,
  defaultTemplateItem,
  imageBasedSystemsListItem,
} from 'testingHelpers';
import { TEMPLATE_SYSTEMS_UPDATE_LIMIT } from 'Pages/Templates/TemplatesTable/constants';

const bananaUUID = 'banana-uuid';

let mockSelectedSystemsCount: number;

jest.mock('react-router-dom', () => ({
  useParams: () => ({ templateUUID: bananaUUID }),
  useNavigate: jest.fn(),
  useSearchParams: () => [{ get: () => null }, jest.fn()],
}));

jest.mock('Hooks/useRootPath', () => () => 'someUrl');

jest.mock('Hooks/useCompatibleSystems');

jest.mock('@tanstack/react-query');

jest.mock('Hooks/useNotification', () => () => ({ notify: () => null }));

jest.mock('services/Templates/TemplateQueries');

jest.mock('services/Systems/SystemsQueries', () => ({
  useAddTemplateToSystemsQuery: () => ({ mutate: () => undefined, isLoading: false }),
  useSystemsListQuery: jest.fn(),
}));

// Mock SystemListView to simulate large selections for max-systems test
// For tests where mockSelectedSystemsCount=0, this renders the real component
jest.mock('./SystemListView', () => {
  const actual = jest.requireActual('./SystemListView');
  const SystemListView = actual.default;

  return {
    __esModule: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: (props: any) => {
      const { setSelectedSystems, setCanAssignTemplate } = props;

      React.useEffect(() => {
        if (mockSelectedSystemsCount > 0) {
          setSelectedSystems(
            Array.from({ length: mockSelectedSystemsCount }, (_, index) => `system-${index}`),
          );
          setCanAssignTemplate(
            mockSelectedSystemsCount > 0 &&
              mockSelectedSystemsCount <= TEMPLATE_SYSTEMS_UPDATE_LIMIT,
          );
        }
      }, [mockSelectedSystemsCount, setSelectedSystems, setCanAssignTemplate]);

      return <SystemListView {...props} />;
    },
  };
});

const mockTemplate = (template: TemplateItem = defaultTemplateItem) =>
  (useFetchTemplate as jest.Mock).mockImplementation(() => ({
    data: template,
  }));

const mockCompatibleSystems = (hasCompatibleSystems: boolean = true) =>
  (useCompatibleSystems as jest.Mock).mockImplementation(() => ({
    hasCompatibleSystems,
    isFetchingCompatibility: false,
    isCompatibilityError: false,
  }));

const mockSystemsList = (data: SystemItem[]) =>
  (useSystemsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    isError: false,
    data: {
      data,
      meta: { total_items: data.length, limit: 20, offset: 0 },
    },
  }));

beforeEach(() => {
  mockSelectedSystemsCount = 0;
  jest.clearAllMocks();

  // Set default mock implementations
  mockTemplate();
  mockCompatibleSystems();
});

afterEach(() => {
  mockSelectedSystemsCount = 0;
});

const waitForRows = async (expectedCount: number) => {
  await waitFor(() => {
    expect(screen.getAllByRole('row')).toHaveLength(expectedCount);
  });
};

const expectIconInRowWith = (iconId: string, systemName: string) => {
  const icon = screen.getByTestId(iconId);
  expect(icon).toBeInTheDocument();
  expect(within(icon.closest('tr')!).getByText(systemName)).toBeInTheDocument();
};

it('shows registration view if no systems are present', async () => {
  mockCompatibleSystems(false);
  mockSystemsList([]);
  render(<AssignTemplateModal />);
  expect(screen.getByText('Non-registered systems')).toBeInTheDocument();
});

it('renders systems list and pre-selects systems already assigned to template', async () => {
  const systems = new Array(15).fill(defaultSystemsListItem).map((item: SystemItem, index) => ({
    ...item,
    id: item.id + index,
    attributes: {
      ...item.attributes,
      display_name: item.attributes.display_name + index,
      template_uuid: !index ? bananaUUID : item.attributes.template_uuid,
    },
  }));

  mockSystemsList(systems);

  render(<AssignTemplateModal />);

  expect(screen.getByText('14867.host.example.com14')).toBeInTheDocument();
  // ensure the first item is pre-selected
  expect(screen.getByRole('checkbox', { name: 'Select row 0' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Select row 1' })).not.toBeChecked();
});

it('prevents selection of systems with minor release versions and shows warning icon', async () => {
  mockSystemsList([defaultSystemsListItem, versionLockedSystemsListItem]);

  render(<AssignTemplateModal />);

  await waitForRows(3); // 1 header + 2 data rows

  expect(screen.getByText('14867.host.example.com')).toBeInTheDocument();
  expect(screen.getByText('40098.host.example.com')).toBeInTheDocument();

  expect(screen.getByRole('checkbox', { name: 'Select row 0' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeDisabled();

  // Warning icon should be present for minor release system
  expectIconInRowWith('system-list-warning-icon', '40098.host.example.com');
});

it('prevents selection of satellite-managed systems and shows warning icon', async () => {
  mockSystemsList([defaultSystemsListItem, satelliteManagedSystemsListItem]);

  render(<AssignTemplateModal />);

  await waitForRows(3); // 1 header + 2 data rows

  expect(screen.getByText('14867.host.example.com')).toBeInTheDocument();
  expect(screen.getByText('69204.host.example.com')).toBeInTheDocument();

  expect(screen.getByRole('checkbox', { name: 'Select row 0' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeDisabled();

  // Warning icon should be present for satellite-managed system
  expectIconInRowWith('system-list-warning-icon', '69204.host.example.com');
});

it('prevents selection of image-based systems and shows warning icon', async () => {
  mockSystemsList([defaultSystemsListItem, imageBasedSystemsListItem]);

  render(<AssignTemplateModal />);

  await waitForRows(3); // 1 header + 2 data rows

  expect(screen.getByText('14867.host.example.com')).toBeInTheDocument();
  expect(screen.getByText('00420.host.example.com')).toBeInTheDocument();

  expect(screen.getByRole('checkbox', { name: 'Select row 0' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: 'Select row 1' })).toBeDisabled();

  // Warning icon should be present for image-based system
  expectIconInRowWith('system-list-warning-icon', '00420.host.example.com');
});

it('prevents assigning a template when more than 1000 systems are selected', async () => {
  // Render the modal with mock SystemListView
  mockSelectedSystemsCount = TEMPLATE_SYSTEMS_UPDATE_LIMIT + 1;

  render(<AssignTemplateModal />);

  expect(await screen.findByText(`Selected (${mockSelectedSystemsCount})`)).toBeInTheDocument();

  const saveButton = screen.getByRole('button', { name: 'Save' });
  expect(saveButton).toBeDisabled();

  await userEvent.hover(saveButton);
  expect(
    await screen.findByText(
      `Cannot assign a template to more than ${TEMPLATE_SYSTEMS_UPDATE_LIMIT} systems at a time.`,
    ),
  ).toBeInTheDocument();
});

it('shows info icon and tooltip for version-locked systems with extended release template', async () => {
  mockTemplate(defaultEUSupportTemplateItem);
  mockSystemsList([defaultSystemsListItem, versionLockedSystemsListItem]);

  const infoIconId = 'system-list-info-icon';
  const infoMessage = `This system is locked to version ${versionLockedSystemsListItem.attributes.rhsm}`;

  render(<AssignTemplateModal />);

  await waitForRows(3); // 1 header + 2 data rows

  expect(screen.getByText('14867.host.example.com')).toBeInTheDocument();
  expect(screen.getByText('40098.host.example.com')).toBeInTheDocument();
  // Expect the info icon to be present for the minor release system
  expectIconInRowWith(infoIconId, '40098.host.example.com');

  const infoIcon = screen.getByTestId(infoIconId);
  await userEvent.hover(infoIcon);
  expect(screen.getByText(infoMessage)).toBeInTheDocument();
});
