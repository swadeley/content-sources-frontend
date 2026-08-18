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
        title='Lightwell Lens'
        ouiaId='lightwell-coverage-header'
        description='Upload your SBOM or package manifest to see how much of your stack is covered by the Validated catalog in Lightwell Network.'
      />
      <PageSection
        aria-label='Coverage Analyzer'
        hasBodyWrapper={false}
        className={`${spacing.pt_0} ${spacing.pbLg}`}
      >
        <Stack hasGutter>
          {report ? (
            <>
              <StackItem>
                <Button variant='link' icon={<ArrowLeftIcon />} onClick={startOver}>
                  Analyze another file
                </Button>
              </StackItem>
              <StackItem>
                <CoverageSummaryCard filename={filename} report={report} />
              </StackItem>
              <StackItem>
                <EcosystemBreakdownCard report={report} />
              </StackItem>
              <StackItem>
                <Divider />
                <HelperText className={`${spacing.pMd}`}>
                  <HelperTextItem variant='indeterminate'>
                    {report.unmatched} out of network packages logged as demand signals for the
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
