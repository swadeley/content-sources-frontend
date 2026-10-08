import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import {
  LwPageHeader,
  PageChromeSlot,
  PageChromeSlots,
  PageTitleStack,
} from 'kit/components/assemblies';
import {
  Alert,
  CardBody,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Title,
  Truncate,
} from '@patternfly/react-core';
import { PlusIcon } from '@patternfly/react-icons';
import CoverageSummaryBlock from './components/CoverageSummaryBlock';
import CveFixesBlock from './components/CveFixesBlock';
import ManifestFormatPopover from './components/ManifestFormatPopover';
import EcosystemBreakdownBlock from './components/EcosystemBreakdownBlock';
import PackageCoverageTable from './components/PackageCoverageTable';
import { ExportMenu } from './components/ExportMenu';
import { useCoverageReport } from './hooks/useCoverageReport';
import { usePackageCoverageTable } from './hooks/usePackageCoverageTable';
import Loader from 'components/Loader';
import LightwellNotFound from '../components/LightwellNotFound';
import type { EcosystemInfo } from './utils/ecosystem';
import { getTotalCveCount } from './utils/cveSeverity';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';
import { LwButton, LwCard } from 'kit/components/primitives';

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const CoverageReport = () => {
  const { reportUUID } = useParams();
  const { filename, report, isLoading, isError, error, startOver } = useCoverageReport(reportUUID);
  const rootPath = useLightwellRootPath();
  const appBreadcrumbsEnabled = useFlag('platform.chrome.app-breadcrumbs');
  const breadcrumbs = useMemo(
    () => [{ pathname: `${rootPath}/lens`, title: 'Lightwell Lens' }],
    [rootPath],
  );

  useRemoteHook({
    scope: 'chrome',
    module: './breadcrumbs/useReplaceBreadcrumbs',
    args: appBreadcrumbsEnabled ? [breadcrumbs, DROP_LAST_CHROME_SEGMENT_OPTIONS] : [[]],
  });

  const ecosystems: EcosystemInfo[] = useMemo(
    () =>
      report?.ecosystem_coverage_summary.map(({ ecosystem, supported }) => ({
        name: ecosystem,
        supported,
      })) ?? [],
    [report],
  );

  // Lifted so the export reuses whatever filters the table currently has applied.
  const table = usePackageCoverageTable(ecosystems);
  const [packageCount, setPackageCount] = useState<number | undefined>();

  if (isLoading) return <Loader />;
  if (isError) throw error;
  if (!report) return <LightwellNotFound />;

  // Drives every CVE surface (summary card, table columns, exports): when the
  // net-delta totals are all zero no package has CVE data worth showing.
  const hasCveData = getTotalCveCount(report.cve_summary) > 0;
  const skippedEntries = report.skipped_entries ?? 0;

  const matchAnalysisTitle = filename ? (
    <Title headingLevel='h1'>
      Match analysis for manifest{' '}
      <strong>
        <span
          style={{
            display: 'inline-block',
            maxWidth: '24rem',
            verticalAlign: 'bottom',
          }}
        >
          <Truncate content={filename} position='middle' />
        </span>
      </strong>
    </Title>
  ) : (
    'Match analysis'
  );

  return (
    <>
      <LwPageHeader hero bodyWidth='100%' bodyMaxWidth='100%'>
        <PageChromeSlots>
          <PageChromeSlot>
            <PageTitleStack title={matchAnalysisTitle} ouiaId='lightwell-coverage-header' />
          </PageChromeSlot>
          <PageChromeSlot>
            <Flex gap={{ default: 'gapSm' }}>
              <FlexItem>
                <ExportMenu
                  uuid={report.uuid}
                  filename={filename}
                  filters={table.debouncedFilters}
                  includeCveData={hasCveData}
                  packageCount={packageCount}
                />
              </FlexItem>
              <FlexItem>
                <LwButton
                  variant='secondary'
                  icon={<PlusIcon />}
                  ouiaId='lightwell-new-analysis-button'
                  onClick={startOver}
                >
                  New analysis
                </LwButton>
              </FlexItem>
            </Flex>
          </PageChromeSlot>
        </PageChromeSlots>
        {skippedEntries > 0 && (
          <PageChromeSlots>
            <PageChromeSlot>
              <Alert
                variant='warning'
                isInline
                title={`${skippedEntries} ${skippedEntries === 1 ? 'package' : 'packages'} skipped`}
              >
                <div>
                  {skippedEntries === 1
                    ? "Its entry doesn't match a supported format."
                    : "Their entries don't match a supported format."}{' '}
                  <ManifestFormatPopover label='View supported formats' />
                </div>
              </Alert>
            </PageChromeSlot>
          </PageChromeSlots>
        )}
      </LwPageHeader>

      <PageSection aria-label='Match analysis' hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <CoverageSummaryBlock report={report} />
          </StackItem>
          {hasCveData && (
            <StackItem>
              <CveFixesBlock report={report} />
            </StackItem>
          )}
          <StackItem>
            <EcosystemBreakdownBlock report={report} />
          </StackItem>
          <StackItem>
            <LwCard>
              <CardBody>
                {/* Remove Flex because it interacts with DataView's 100%-height and creates extra space below pagination */}
                <PackageCoverageTable
                  uuid={report.uuid}
                  ecosystems={ecosystems}
                  table={table}
                  showCveColumns={hasCveData}
                  onPackageCountChange={setPackageCount}
                />
              </CardBody>
            </LwCard>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default CoverageReport;
