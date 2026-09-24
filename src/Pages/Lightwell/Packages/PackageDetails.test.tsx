import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PackageDetails from './PackageDetails';
import {
  useMavenPackageVersionsListQuery,
  usePythonPackageVersionsQuery,
} from 'services/Content/ContentQueries';
import {
  defaultLightwellContentItem,
  defaultLightwellRepositoryPackageItem,
  defaultPythonRemediatedContentItem,
  defaultPythonPackageVersions,
  defaultPythonRemediatedRepositoryPackageItem,
  defaultPythonValidatedContentItem,
  defaultPythonValidatedPackageItem,
  defaultPythonValidatedPackageVersions,
  gradleRemediatedDependencySnippet,
  gradleValidatedDependencySnippet,
  javaRemediatedCopyCommand,
  mavenRemediatedDependencySnippet,
  mavenValidatedDependencySnippet,
  pipConfValidatedInstallSnippet,
  pipValidatedInstallSnippet,
  ReactQueryTestWrapper,
  requirementsValidatedInstallSnippet,
  otherJavaRemediatedCopyCommand,
} from 'testingHelpers';
import { getRepositoryPathSlug } from '../helpers';
import useLightwellRepository from '../../../Hooks/Lightwell/useLightwellRepository';

jest.mock('services/Content/ContentQueries', () => ({
  useMavenPackageVersionsListQuery: jest.fn(),
  usePythonPackageVersionsQuery: jest.fn(),
}));

jest.mock('Hooks/Lightwell/useLightwellRepository');

const defaultRepoSlug = getRepositoryPathSlug(
  defaultLightwellContentItem.content_type,
  defaultLightwellContentItem.security_level,
);

const packageName = defaultLightwellRepositoryPackageItem.name;

const mockUseParams = jest.fn<
  Partial<{ repoName: string; group: string; packageName: string }>,
  []
>();

let searchParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  useSearchParams: () => [searchParams],
}));

jest.mock('Hooks/Lightwell/navigation/useLightwellRootPath', () => ({
  useLightwellRootPath: jest.fn(() => '/lightwell'),
}));

const mockUseRemoteHook = jest.fn();
jest.mock('@scalprum/react-core', () => ({
  useRemoteHook: (...args: unknown[]) => mockUseRemoteHook(...args),
}));

jest.mock('@unleash/proxy-client-react', () => ({
  useFlag: jest.fn(() => true),
}));

const mockNavigateTo = jest.fn();
jest.mock('Hooks/Lightwell/navigation/useLightwellNavigateTo', () => ({
  useLightwellNavigateTo: jest.fn(() => ({ navigateTo: mockNavigateTo })),
}));

const defaultBuilds = [
  { version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
];

type PackageMetadata = {
  summary?: string;
  license?: string;
  author?: string;
  project_url?: string;
};

const mockVersionsListQuery = (
  builds = defaultBuilds,
  metadata: PackageMetadata = {},
  version = '3.14.0',
) => ({
  isLoading: false,
  data: {
    group: defaultLightwellRepositoryPackageItem.group,
    name: defaultLightwellRepositoryPackageItem.name,
    versions: [
      {
        group: defaultLightwellRepositoryPackageItem.group,
        name: defaultLightwellRepositoryPackageItem.name,
        version,
        builds,
        ...metadata,
      },
    ],
  },
});

const renderPackageDetails = () =>
  render(
    <ReactQueryTestWrapper>
      <PackageDetails />
    </ReactQueryTestWrapper>,
  );

beforeEach(() => {
  searchParams = new URLSearchParams();
  mockUseParams.mockReturnValue({
    repoName: defaultRepoSlug,
    group: defaultLightwellRepositoryPackageItem.group,
    packageName,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultLightwellContentItem,
    repoUUID: defaultLightwellContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => mockVersionsListQuery());
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: undefined,
  }));
});

it('shows empty state when the package has no builds', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      group: defaultLightwellRepositoryPackageItem.group,
      name: defaultLightwellRepositoryPackageItem.name,
      versions: [],
    },
  }));

  renderPackageDetails();

  expect(await screen.findByRole('heading', { name: 'No package details' })).toBeInTheDocument();
  expect(await screen.findByText('No details available yet for this package.')).toBeInTheDocument();
});

const setupNoReleasePackage = () => {
  const data = {
    group: 'org.json.test',
    name: 'json-test',
    versions: [
      {
        group: 'org.json.test',
        name: 'json-test',
        version: '2.21.2',
        builds: [{ version: '2.21.2', release: '', created_at: '2026-07-01T00:00:00Z' }],
      },
      {
        group: 'org.json.test',
        name: 'json-test',
        version: '2.20.0',
        builds: [{ version: '2.20.0', release: '', created_at: '2026-06-15T00:00:00Z' }],
      },
      {
        group: 'org.json.test',
        name: 'json-test',
        version: '2.19.1',
        builds: [{ version: '2.19.1', release: '', created_at: '2026-06-01T00:00:00Z' }],
      },
    ],
  };

  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data,
  }));
};

const setupPythonRemediatedPackage = () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('python', 'remediated'),
    packageName: defaultPythonRemediatedRepositoryPackageItem.name,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultPythonRemediatedContentItem,
    repoUUID: defaultPythonRemediatedContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: defaultPythonPackageVersions,
  }));
};

it('does not show Releases tab when package has no release', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Overview')).toBeInTheDocument();
  expect(screen.queryByText('Releases')).not.toBeInTheDocument();
});

it('renders package detail content with builds', async () => {
  renderPackageDetails();

  expect(
    await screen.findByRole('heading', {
      name: `${defaultLightwellRepositoryPackageItem.group}:${packageName}`,
    }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Overview')).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  expect(await screen.findByText('About this package')).toBeInTheDocument();
  expect(await screen.findByText('How to use')).toBeInTheDocument();
});

it('renders sidebar metadata', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() =>
    mockVersionsListQuery(defaultBuilds, {
      summary: 'JSON library for Java',
      license: 'MIT',
      author: 'JSON.org',
      project_url: 'https://example.com/json-test',
    }),
  );

  renderPackageDetails();

  expect(await screen.findByText('Last updated')).toBeInTheDocument();
  expect(await screen.findByText('Group ID')).toBeInTheDocument();
  expect(await screen.findByText(defaultLightwellRepositoryPackageItem.group)).toBeInTheDocument();
  expect(await screen.findByText('Rebuilt by')).toBeInTheDocument();
  expect(await screen.findByText('Red Hat')).toBeInTheDocument();
  expect(await screen.findByText('JSON library for Java')).toBeInTheDocument();
  expect(await screen.findByText('License')).toBeInTheDocument();
  expect(await screen.findByText('MIT')).toBeInTheDocument();
  expect(screen.queryByText('show more')).not.toBeInTheDocument();
  expect(await screen.findByText('Original author')).toBeInTheDocument();
  expect(await screen.findByText('JSON.org')).toBeInTheDocument();
  expect(await screen.findByText('Project')).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Source' })).toHaveAttribute(
    'href',
    'https://example.com/json-test',
  );
});

it('shows fallback summary when maven package summary is unavailable', async () => {
  renderPackageDetails();

  expect(await screen.findByText('Package description not yet available.')).toBeInTheDocument();
  expect(screen.queryByText('License')).not.toBeInTheDocument();
  expect(screen.queryByText('Original author')).not.toBeInTheDocument();
});

it('shows Versions tab for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Versions')).toBeInTheDocument();
  expect(screen.queryByText('Releases')).not.toBeInTheDocument();
});

it('shows version selector dropdown for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  const toggle = await screen.findByRole('button', { name: '2.21.2' });
  expect(toggle).toBeInTheDocument();
  expect(toggle.classList.contains('pf-v6-c-menu-toggle')).toBe(true);

  await userEvent.click(toggle);

  const menuItems = await screen.findAllByRole('menuitem');
  expect(menuItems).toHaveLength(3);
});

it('shows non-release description text', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(
    await screen.findByText(/rebuilt from source by Red Hat with no modifications/),
  ).toBeInTheDocument();
});

it('shows upstream versions list in sidebar for non-release packages', async () => {
  setupNoReleasePackage();

  renderPackageDetails();

  expect(await screen.findByText('Upstream versions')).toBeInTheDocument();
  expect(await screen.findByText('2.21.2, 2.20.0, 2.19.1')).toBeInTheDocument();
});

const setupMultiVersionReleasePackage = () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      group: 'org.json.test',
      name: 'json-test',
      versions: [
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '3.14.0',
          builds: [
            { version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
          ],
        },
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '2.12.0',
          builds: [
            { version: '2.12.0', release: 'rhlw-00002', created_at: '2026-06-18T00:00:00Z' },
          ],
        },
      ],
    },
  }));
};

it('shows Lightwell releases for the selected version on the Releases tab', async () => {
  setupMultiVersionReleasePackage();

  renderPackageDetails();

  await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));

  expect(await screen.findByText('Releases for version 3.14.0')).toBeInTheDocument();

  const releasesTable = screen.getByRole('grid', { name: 'Releases for 3.14.0' });
  const releaseRows = releasesTable.querySelectorAll('tbody tr');
  expect(releaseRows).toHaveLength(1);
  expect(releaseRows[0]).toHaveTextContent('3.14.0.rhlw-00001');
  expect(releaseRows[0]).toHaveTextContent('Latest');
  expect(screen.queryByText('2.12.0.rhlw-00002')).not.toBeInTheDocument();

  await userEvent.click(await screen.findByRole('button', { name: '3.14.0' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '2.12.0' }));

  expect(await screen.findByText('Releases for version 2.12.0')).toBeInTheDocument();

  const selectedVersionTable = screen.getByRole('grid', { name: 'Releases for 2.12.0' });
  const selectedVersionRows = selectedVersionTable.querySelectorAll('tbody tr');
  expect(selectedVersionRows).toHaveLength(1);
  expect(selectedVersionRows[0]).toHaveTextContent('2.12.0.rhlw-00002');
  expect(selectedVersionRows[0]).toHaveTextContent('Latest');
  expect(screen.queryByText('3.14.0.rhlw-00001')).not.toBeInTheDocument();
});

it('lists all Lightwell releases for the selected version from latest to oldest', async () => {
  (useMavenPackageVersionsListQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    data: {
      group: 'org.json.test',
      name: 'json-test',
      versions: [
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '3.14.0',
          builds: [
            { version: '3.14.0', release: 'rhlw-00003', created_at: '2026-07-03T00:00:00Z' },
            { version: '3.14.0', release: 'rhlw-00002', created_at: '2026-07-02T00:00:00Z' },
            { version: '3.14.0', release: 'rhlw-00001', created_at: '2026-07-01T00:00:00Z' },
          ],
        },
        {
          group: 'org.json.test',
          name: 'json-test',
          version: '2.12.0',
          builds: [
            { version: '2.12.0', release: 'rhlw-00002', created_at: '2026-06-18T00:00:00Z' },
            { version: '2.12.0', release: 'rhlw-00001', created_at: '2026-06-17T00:00:00Z' },
          ],
        },
      ],
    },
  }));

  renderPackageDetails();

  await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));

  const releasesTable = await screen.findByRole('grid', { name: 'Releases for 3.14.0' });
  const releaseRows = releasesTable.querySelectorAll('tbody tr');
  expect(releaseRows).toHaveLength(3);
  expect(releaseRows[0]).toHaveTextContent('3.14.0.rhlw-00003');
  expect(releaseRows[0]).toHaveTextContent('Latest');
  expect(releaseRows[0]).toHaveTextContent('3 Jul 2026');
  expect(releaseRows[1]).toHaveTextContent('3.14.0.rhlw-00002');
  expect(releaseRows[1]).toHaveTextContent('2 Jul 2026');
  expect(releaseRows[1]).not.toHaveTextContent('Latest');
  expect(releaseRows[2]).toHaveTextContent('3.14.0.rhlw-00001');
  expect(releaseRows[2]).toHaveTextContent('1 Jul 2026');
  expect(screen.queryByText('2.12.0.rhlw-00002')).not.toBeInTheDocument();
});

it('shows version dropdown for multi-version release packages', async () => {
  setupMultiVersionReleasePackage();

  renderPackageDetails();

  const toggle = await screen.findByRole('button', { name: '3.14.0' });
  expect(toggle).toBeInTheDocument();

  await userEvent.click(toggle);

  const menuItems = await screen.findAllByRole('menuitem');
  expect(menuItems).toHaveLength(2);
});

it('shows how to use section for python package', async () => {
  setupPythonRemediatedPackage();

  renderPackageDetails();

  expect(
    await screen.findByRole('heading', { name: defaultPythonRemediatedRepositoryPackageItem.name }),
  ).toBeInTheDocument();
  expect(await screen.findByText('How to use')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Install' })).not.toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'pip' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'requirements.txt' })).toBeInTheDocument();
  expect(await screen.findByRole('tab', { name: 'pip.conf' })).toBeInTheDocument();
});

it('shows Python remediated releases and copies the published pip version', async () => {
  setupPythonRemediatedPackage();
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: {
      name: 'requests',
      versions: [
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1+rhlw.1',
          last_updated: '2026-07-01T00:00:00Z',
        },
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '3.0.1+rhlw.2',
          last_updated: '2026-07-02T00:00:00Z',
        },
        {
          ...defaultPythonPackageVersions.versions[0],
          version: '2.9.0+rhlw.1',
          last_updated: '2026-06-01T00:00:00Z',
        },
      ],
    },
  }));
  const writeText = mockClipboard();

  renderPackageDetails();

  expect(await screen.findByRole('tab', { name: 'Releases' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Versions' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Releases' }));
  const latestRelease = await screen.findAllByRole('button', { name: '3.0.1+rhlw.2' });
  await userEvent.click(latestRelease[0]);
  expect(writeText).toHaveBeenCalledWith('pip install requests==3.0.1+rhlw.2');

  await userEvent.click(screen.getByRole('button', { name: '2.9.0' }));
  expect(
    await screen.findByRole('heading', { name: 'Releases for version 2.9.0' }),
  ).toBeInTheDocument();
  const olderRelease = await screen.findAllByRole('button', { name: '2.9.0+rhlw.1' });
  await userEvent.click(olderRelease[0]);
  expect(writeText).toHaveBeenCalledWith('pip install requests==2.9.0+rhlw.1');
});

const mockClipboard = () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  return writeText;
};

const assertClipboardCopy = async (
  writeText: jest.Mock,
  click: () => Promise<void>,
  expected: string,
) => {
  writeText.mockClear();
  await click();
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(expected);
};

it('copies maven coordinate to clipboard for remediated java package', async () => {
  const writeText = mockClipboard();

  setupMultiVersionReleasePackage();
  renderPackageDetails();

  // Maven tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    mavenRemediatedDependencySnippet,
  );

  // Gradle tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Gradle' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    gradleRemediatedDependencySnippet,
  );

  // "Releases for version x.x.x" section of Releases tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Releases' }));
      await userEvent.click(await screen.findByRole('button', { name: '3.14.0.rhlw-00001' }));
    },
    javaRemediatedCopyCommand,
  );

  // Releases for a different selected version
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: '3.14.0' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: '2.12.0' }));
      await userEvent.click(await screen.findByRole('button', { name: '2.12.0.rhlw-00002' }));
    },
    otherJavaRemediatedCopyCommand,
  );
});

const setupPythonValidatedPackage = () => {
  mockUseParams.mockReturnValue({
    repoName: getRepositoryPathSlug('python', 'validated'),
    packageName: defaultPythonValidatedPackageItem.name,
  });
  (useLightwellRepository as jest.Mock).mockReturnValue({
    repository: defaultPythonValidatedContentItem,
    repoUUID: defaultPythonValidatedContentItem.uuid,
    isLoading: false,
    isError: false,
    error: undefined,
  });
  (usePythonPackageVersionsQuery as jest.Mock).mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    data: defaultPythonValidatedPackageVersions,
  }));
};

it('copies pip command to clipboard for validated python package', async () => {
  const writeText = mockClipboard();

  setupPythonValidatedPackage();
  renderPackageDetails();

  // pip tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipValidatedInstallSnippet,
  );

  // requirements.txt tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'requirements.txt' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    requirementsValidatedInstallSnippet,
  );

  // pip.conf tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'pip.conf' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    pipConfValidatedInstallSnippet,
  );
});

it('copies maven coordinate to clipboard for validated java package', async () => {
  const writeText = mockClipboard();

  setupNoReleasePackage();
  renderPackageDetails();

  // Maven tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    mavenValidatedDependencySnippet,
  );

  // Gradle tab in "How to use" section of Overview tab
  await assertClipboardCopy(
    writeText,
    async () => {
      await userEvent.click(await screen.findByRole('tab', { name: 'Gradle' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Copy' }));
    },
    gradleValidatedDependencySnippet,
  );
});

it('registers breadcrumbs with Chrome via useRemoteHook', async () => {
  renderPackageDetails();

  await screen.findByRole('heading', {
    name: `${defaultLightwellRepositoryPackageItem.group}:${packageName}`,
  });

  expect(mockUseRemoteHook).toHaveBeenCalledWith({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: [
      [
        { pathname: '/lightwell', title: 'Lightwell Repositories' },
        { pathname: `/lightwell/${defaultRepoSlug}`, title: 'Java Validated' },
        {
          pathname: `/lightwell/${defaultRepoSlug}/${encodeURIComponent(defaultLightwellRepositoryPackageItem.group)}/${encodeURIComponent(packageName)}`,
          title: `${defaultLightwellRepositoryPackageItem.group}:${packageName}`,
        },
      ],
      { dropLastChromeSegment: true },
    ],
  });
});
