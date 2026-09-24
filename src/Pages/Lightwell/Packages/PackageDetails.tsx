import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Grid,
  GridItem,
  Icon,
  Label,
  MenuToggle,
  PageBreadcrumb,
  PageSection,
  Tab,
  TabContent,
  TabContentBody,
  Tabs,
  TabTitleText,
  Title,
  Truncate,
} from '@patternfly/react-core';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { CodeIcon, JavaIcon, PythonIcon } from '@patternfly/react-icons';
import { createUseStyles } from 'react-jss';
import { createRef, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import Loader from 'components/Loader';
import LightwellEmptyState from '../components/LightwellEmptyState';
import LightwellNotFound from '../components/LightwellNotFound';
import LightwellPageHeader from '../components/LightwellPageHeader';
import {
  useMavenPackageVersionsListQuery,
  usePythonPackageVersionsQuery,
} from 'services/Content/ContentQueries';
import { LIGHTWELL_USE_MOCK } from '../constants';
import { formatDistributionUrl, formatRepositoryName } from '../helpers';
import {
  getMockLightwellPackages,
  getMockMavenPackageVersionsList,
  getMockPythonPackageVersions,
} from '../mockPackages';
import RemediatedDataWarning from '../RemediatedDataWarning';
import ConnectRepositoryModal from '../Repositories/components/ConnectRepositoryModal';
import useLightwellRepository from '../../../Hooks/Lightwell/useLightwellRepository';
import PackageOverviewTab from './tabs/PackageOverviewTab';
import PackageReleasesTab from './tabs/PackageReleasesTab';
import PackageSidebar from './components/PackageSidebar';
import PackageVersionsTab from './tabs/PackageVersionsTab';
import {
  lightwellReleaseNum,
  pythonLightwellRelease,
  sortVersionsDesc,
  stripLightwellVersionSuffix,
  toLightwellVersion,
} from './utils/versions';
import { useLightwellNavigateTo } from '../../../Hooks/Lightwell/navigation/useLightwellNavigateTo';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';

const useStyles = createUseStyles({
  detailCard: {
    overflow: 'visible',
  },
});

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const PackageDetails = () => {
  const classes = useStyles();
  const { navigateTo } = useLightwellNavigateTo();
  const rootPath = useLightwellRootPath();

  const {
    repoName: repoSlug = '',
    group: groupParam = '',
    packageName: packageNameParam = '',
  } = useParams();

  const packageName = packageNameParam ? decodeURIComponent(packageNameParam) : '';
  const packageGroup = decodeURIComponent(groupParam);

  const [activeTabKey, setActiveTabKey] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);

  const overviewTabRef = createRef<HTMLElement>();
  const releasesTabRef = createRef<HTMLElement>();
  const versionsTabRef = createRef<HTMLElement>();

  const useMock = LIGHTWELL_USE_MOCK;

  const {
    repository,
    repoUUID,
    isLoading: isResolvingRepository,
    isError,
    error,
  } = useLightwellRepository(repoSlug);

  const isMaven = repository?.content_type === 'maven';
  const isPython = repository?.content_type === 'python';

  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');

  const breadcrumbRepoName = repository
    ? formatRepositoryName(repository.content_type, repository.security_level, repository.name)
    : '';
  const breadcrumbPackageName = isMaven ? `${packageGroup}:${packageName}` : packageName || '';
  const breadcrumbPackagePath =
    isMaven && packageGroup
      ? `${rootPath}/${repoSlug}/${encodeURIComponent(packageGroup)}/${encodeURIComponent(packageName)}`
      : `${rootPath}/${repoSlug}/${encodeURIComponent(packageName)}`;

  const breadcrumbs = useMemo(
    () => [
      { pathname: rootPath, title: 'Lightwell Repositories' },
      { pathname: `${rootPath}/${repoSlug}`, title: breadcrumbRepoName },
      { pathname: breadcrumbPackagePath, title: breadcrumbPackageName },
    ],
    [rootPath, repoSlug, breadcrumbRepoName, breadcrumbPackagePath, breadcrumbPackageName],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  const mavenVersionsListQuery = useMavenPackageVersionsListQuery(
    repoUUID,
    packageGroup,
    packageName,
    !useMock,
  );

  const pythonPackageVersionsQuery = usePythonPackageVersionsQuery(
    repoUUID,
    packageName,
    isPython && !!repoUUID && !!packageName && !useMock,
  );

  const mockMavenVersionsList = useMemo(
    () =>
      useMock && isMaven
        ? getMockMavenPackageVersionsList(repoUUID, packageGroup, packageName)
        : undefined,
    [useMock, isMaven, repoUUID, packageGroup, packageName],
  );

  const mockPythonVersions = useMemo(
    () => (useMock && isPython ? getMockPythonPackageVersions(repoUUID, packageName) : undefined),
    [useMock, isPython, repoUUID, packageName],
  );

  const mavenVersionsData = useMock ? mockMavenVersionsList : mavenVersionsListQuery.data;
  const pythonVersionsData = useMock ? mockPythonVersions : pythonPackageVersionsQuery.data;

  const mavenVersions = useMemo(() => {
    if (!isMaven || !mavenVersionsData?.versions) return [];
    return sortVersionsDesc(mavenVersionsData.versions.map((v) => v.version));
  }, [isMaven, mavenVersionsData?.versions]);

  const mavenAllReleases = useMemo(() => {
    if (!isMaven || !mavenVersionsData?.versions) return [];
    return mavenVersionsData.versions.flatMap((v) => v.builds);
  }, [isMaven, mavenVersionsData?.versions]);

  const mavenHasRelease = useMemo(
    () => mavenAllReleases.some((r) => !!r.release),
    [mavenAllReleases],
  );

  const pythonVersionsFromApi = useMemo(
    () => pythonVersionsData?.versions?.map((version) => version.version) ?? [],
    [pythonVersionsData?.versions],
  );

  const pythonVersions = useMemo(() => {
    const versions = useMock
      ? (getMockLightwellPackages(repoUUID).find((pkg) => pkg.name === packageName)?.versions ?? [])
      : pythonVersionsFromApi;
    return sortVersionsDesc([...new Set(versions.map(stripLightwellVersionSuffix))]);
  }, [useMock, repoUUID, packageName, pythonVersionsFromApi]);

  const pythonVersionReleases = useMemo(
    () =>
      (pythonVersionsData?.versions ?? []).map((version) => ({
        version: stripLightwellVersionSuffix(version.version),
        release: pythonLightwellRelease(version.version),
        created_at: version.last_updated,
      })),
    [pythonVersionsData?.versions],
  );

  const hasRelease = isMaven
    ? mavenHasRelease
    : repository?.security_level === 'remediated' &&
      pythonVersionReleases.some((release) => !!release.release);

  const packageVersion = isMaven ? (mavenVersions[0] ?? '') : (pythonVersions[0] ?? '');

  const activeVersion = selectedVersion || packageVersion;

  const mavenDetail = mavenVersionsData?.versions.find((v) => v.version === activeVersion);

  const mavenBuilds = useMemo(() => {
    if (!isMaven || !hasRelease || !mavenVersionsData?.versions) return [];

    return mavenVersionsData.versions
      .filter((v) => v.version === activeVersion)
      .flatMap((v) => v.builds)
      .sort((a, b) => lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release));
  }, [isMaven, hasRelease, mavenVersionsData?.versions, activeVersion]);

  const pythonBuilds = useMemo(
    () =>
      hasRelease
        ? pythonVersionReleases
            .filter((release) => release.version === activeVersion && release.release)
            .sort((a, b) => lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release))
        : [],
    [hasRelease, pythonVersionReleases, activeVersion],
  );

  const pythonDetail = useMemo(
    () =>
      pythonVersionsData?.versions.find(
        (version) =>
          version.version ===
          (pythonBuilds[0] ? toLightwellVersion(pythonBuilds[0]) : activeVersion),
      ),
    [pythonVersionsData?.versions, pythonBuilds, activeVersion],
  );

  const versionOptions = isPython ? pythonVersions : mavenVersions;

  useEffect(() => {
    if (!versionOptions.length) {
      return;
    }

    if (!selectedVersion || !versionOptions.includes(selectedVersion)) {
      setSelectedVersion(versionOptions[0]);
    }
  }, [versionOptions, selectedVersion]);

  const isLoadingDetail = useMock
    ? false
    : isMaven
      ? mavenVersionsListQuery.isLoading
      : pythonPackageVersionsQuery.isLoading && !pythonPackageVersionsQuery.data;

  if (isResolvingRepository) {
    return <Loader />;
  }

  if (!repository) {
    return <LightwellNotFound />;
  }

  if (!repoUUID || isError) throw error;

  const builds = isMaven ? (hasRelease ? mavenBuilds : (mavenDetail?.builds ?? [])) : pythonBuilds;
  const latestBuild = builds[0];

  const upstreamVersion = isMaven ? (latestBuild?.version ?? activeVersion) : activeVersion;

  const displayVersion = isMaven
    ? hasRelease && latestBuild
      ? toLightwellVersion(latestBuild)
      : activeVersion
    : activeVersion;

  const lastUpdated = isMaven
    ? (builds
        .map((b) => b.created_at)
        .sort()
        .at(-1) ?? '')
    : (pythonDetail?.last_updated ?? '');

  const detailReady = !isLoadingDetail;
  const doneLoading = detailReady && (isMaven ? !!mavenVersionsData : !!pythonVersionsData);

  const hasDetail =
    detailReady &&
    (isMaven
      ? builds.length > 0 || (!hasRelease && mavenVersions.length > 0)
      : pythonVersions.length > 0);

  const showEmpty = doneLoading && !hasDetail;

  const showVersionsTab = isMaven
    ? !hasRelease
    : isPython && !hasRelease && pythonVersions.length > 0;

  const showReleasesTab = hasRelease && (isMaven || isPython);

  if (!doneLoading && !showEmpty) {
    return <Loader />;
  }

  return (
    <>
      {!appBreadcrumbsEnabled && (
        <PageBreadcrumb isWidthLimited>
          <Breadcrumb ouiaId='lightwell-package-details-breadcrumb'>
            <BreadcrumbItem component='button' onClick={() => navigateTo('repositories')}>
              Lightwell Repositories
            </BreadcrumbItem>
            <BreadcrumbItem
              component='button'
              onClick={() => navigateTo('repositoryPackages', { repoSlug })}
            >
              {breadcrumbRepoName}
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              <Truncate content={isMaven ? `${packageGroup}:${packageName}` : packageName || '—'} />
            </BreadcrumbItem>
          </Breadcrumb>
        </PageBreadcrumb>
      )}

      <LightwellPageHeader
        title={
          <Title headingLevel='h1' ouiaId='lightwell-package-details-header'>
            {isMaven ? `${packageGroup}:${packageName}` : packageName || 'Package details'}
          </Title>
        }
        titleStart={
          <Icon size='xl'>
            {repository.content_type === 'maven' ? <JavaIcon /> : <PythonIcon />}
          </Icon>
        }
        titleEnd={
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            {versionOptions.length === 1 && (selectedVersion || activeVersion) ? (
              <Label variant='outline' style={{ fontSize: '14px', padding: '8px 16px' }}>
                {isMaven && hasRelease ? upstreamVersion : selectedVersion || activeVersion}
              </Label>
            ) : null}
            {versionOptions.length > 1 ? (
              <Dropdown
                isScrollable
                onSelect={(_e, val) => {
                  setSelectedVersion(val as string);
                  setVersionDropdownOpen(false);
                }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    variant='primary'
                    ref={toggleRef}
                    onClick={() => setVersionDropdownOpen((prev) => !prev)}
                    isExpanded={versionDropdownOpen}
                    ouiaId='lightwell-version-selector'
                  >
                    {selectedVersion || activeVersion}
                  </MenuToggle>
                )}
                onOpenChange={(isOpen) => setVersionDropdownOpen(isOpen)}
                isOpen={versionDropdownOpen}
              >
                <DropdownList>
                  {versionOptions.map((v) => (
                    <DropdownItem key={v} value={v} isSelected={selectedVersion === v}>
                      {v}
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            ) : null}
          </Flex>
        }
        actions={
          <ConnectRepositoryModal
            repository={{
              uuid: repository.uuid,
              name: repository.name,
              published_distribution_url: formatDistributionUrl(
                repository.published_distribution_url || '',
              ),
              content_type: repository.content_type,
            }}
          >
            <Button size='sm' variant='secondary' icon={<CodeIcon />}>
              Connect
            </Button>
          </ConnectRepositoryModal>
        }
      />

      {showEmpty || hasDetail ? (
        <PageSection hasBodyWrapper={false} aria-label='Package details'>
          {(repository.security_level === 'remediated' ||
            repository.security_level === 'predisclosure') && <RemediatedDataWarning />}
          {showEmpty ? (
            <LightwellEmptyState
              variant='empty'
              displayedItemsName='package details'
              bodyText='No details available yet for this package.'
            />
          ) : null}

          {hasDetail ? (
            <Card className={classes.detailCard}>
              <CardBody>
                <Grid hasGutter>
                  <GridItem md={8}>
                    <Tabs
                      activeKey={activeTabKey}
                      onSelect={(_, eventKey) => setActiveTabKey(eventKey as number)}
                      aria-label='Package detail tabs'
                      ouiaId='lightwell-package-detail-tabs'
                    >
                      <Tab
                        eventKey={0}
                        title={<TabTitleText>Overview</TabTitleText>}
                        tabContentRef={overviewTabRef}
                        ouiaId='lightwell-package-overview-tab'
                      />
                      {showReleasesTab && (
                        <Tab
                          eventKey={1}
                          title={<TabTitleText>Releases</TabTitleText>}
                          tabContentRef={releasesTabRef}
                          ouiaId='lightwell-package-releases-tab'
                        />
                      )}
                      {showVersionsTab && (
                        <Tab
                          eventKey={1}
                          title={<TabTitleText>Versions</TabTitleText>}
                          tabContentRef={versionsTabRef}
                          ouiaId='lightwell-package-versions-tab'
                        />
                      )}
                    </Tabs>
                    <>
                      <TabContent
                        eventKey={0}
                        id='lightwell-package-overview-panel'
                        ref={overviewTabRef}
                        aria-label='Overview'
                      >
                        <TabContentBody hasPadding>
                          <PackageOverviewTab
                            isMaven={isMaven}
                            group={packageGroup}
                            name={packageName}
                            latestRelease={displayVersion}
                            packageVersion={upstreamVersion}
                            hasRelease={hasRelease}
                            summary={isMaven ? mavenDetail?.summary : pythonDetail?.summary}
                            sourceUrl={formatDistributionUrl(
                              repository.published_distribution_url ?? '',
                            )}
                            repository={{
                              uuid: repository.uuid,
                              name: repository.name,
                              published_distribution_url: formatDistributionUrl(
                                repository.published_distribution_url ?? '',
                              ),
                              content_type: repository.content_type ?? '',
                              security_level: repository.security_level,
                            }}
                          />
                        </TabContentBody>
                      </TabContent>
                      {showReleasesTab && (
                        <TabContent
                          eventKey={1}
                          id='lightwell-package-releases-panel'
                          ref={releasesTabRef}
                          aria-label='Releases'
                          hidden
                        >
                          <TabContentBody hasPadding>
                            <PackageReleasesTab
                              version={upstreamVersion}
                              builds={isPython ? pythonBuilds : mavenBuilds}
                              packageIdentity={{
                                name: packageName,
                                group: packageGroup,
                                isPython,
                              }}
                            />
                          </TabContentBody>
                        </TabContent>
                      )}
                      {showVersionsTab && (
                        <TabContent
                          eventKey={1}
                          id='lightwell-package-versions-panel'
                          ref={versionsTabRef}
                          aria-label='Versions'
                          hidden
                        >
                          <TabContentBody hasPadding>
                            <PackageVersionsTab
                              currentVersion={selectedVersion || activeVersion}
                              versions={versionOptions}
                              latestReleases={isPython ? pythonVersionReleases : mavenAllReleases}
                              onVersionSelect={setSelectedVersion}
                            />
                          </TabContentBody>
                        </TabContent>
                      )}
                    </>
                  </GridItem>
                  <GridItem md={4}>
                    <PackageSidebar
                      lastUpdated={lastUpdated}
                      groupId={packageGroup}
                      upstreamVersion={upstreamVersion}
                      allVersions={
                        isMaven && !hasRelease
                          ? mavenVersions
                          : isPython && pythonVersions.length > 1
                            ? pythonVersions
                            : undefined
                      }
                      license={isMaven ? mavenDetail?.license : pythonDetail?.license}
                      author={isMaven ? mavenDetail?.author : pythonDetail?.author?.name}
                      projectUrl={isMaven ? mavenDetail?.project_url : pythonDetail?.project_url}
                      hasRelease={hasRelease}
                    />
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>
          ) : null}
        </PageSection>
      ) : null}
    </>
  );
};

export default PackageDetails;
