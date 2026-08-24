import LightwellPageHeader from '../components/LightwellPageHeader';
import {
  PageSection,
  Stack,
  StackItem,
  Button,
  Divider,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import ManifestUploadCard from './components/ManifestUploadCard';
import CoverageSummaryCard from './components/CoverageSummaryCard';
import EcosystemBreakdownCard from './components/EcosystemBreakdownCard';
import { ArrowLeftIcon } from '@patternfly/react-icons';

import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { useCoverageAnalysis } from './hooks/useCoverageAnalysis';

const CoverageAnalyzer = () => {
  const { filename, report, uploadProps, startOver } = useCoverageAnalysis();

  return (
    <>
      <LightwellPageHeader
        title={report ? `Coverage report for ${filename}` : 'Lightwell Lens'}
        ouiaId='lightwell-coverage-header'
        description={
          report
            ? undefined
            : 'Upload your SBOM or package manifest to see how much of your stack is covered by the Validated catalog in Lightwell Network.'
        }
        actions={
          report ? (
            <Button variant='link' icon={<ArrowLeftIcon />} onClick={startOver}>
              Analyze another file
            </Button>
          ) : undefined
        }
      />
      {/* plXs matches the mXs margin LightwellPageHeader applies to its inner title flex, keeping content left-aligned */}
      <PageSection
        aria-label='Coverage Analyzer'
        hasBodyWrapper={false}
        className={`${spacing.pt_0} ${spacing.pbLg} ${spacing.pxLg} ${spacing.plXs}`}
      >
        <Stack hasGutter style={{ maxWidth: 1200 }}>
          {report ? (
            <>
              <StackItem>
                <CoverageSummaryCard report={report} />
              </StackItem>
              <StackItem>
                <EcosystemBreakdownCard report={report} />
              </StackItem>
              <StackItem>
                <Divider />
                <HelperText className={spacing.pMd}>
                  <HelperTextItem variant='default'>
                    {report.unmatched} out-of-network packages logged as demand signals for the
                    Catalog Build Queue. This does not constitute a commitment to build these
                    packages.
                  </HelperTextItem>
                </HelperText>
              </StackItem>
            </>
          ) : (
            <StackItem>
              <ManifestUploadCard {...uploadProps} />
            </StackItem>
          )}
        </Stack>
      </PageSection>
    </>
  );
};

export default CoverageAnalyzer;
