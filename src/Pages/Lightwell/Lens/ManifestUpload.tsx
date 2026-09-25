import { useMemo } from 'react';
import { useRemoteHook } from '@scalprum/react-core';
import { useFlag } from '@unleash/proxy-client-react';
import { PageSection, Stack, StackItem } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { LwPageHero } from 'kit/components/assemblies';
import { useManifestUpload } from './hooks/useManifestUpload';
import ManifestUploadCard from './components/ManifestUploadCard';
import { useLightwellRootPath } from '../../../Hooks/Lightwell/navigation/useLightwellRootPath';

const DROP_LAST_CHROME_SEGMENT_OPTIONS = { dropLastChromeSegment: true };

const ManifestUpload = () => {
  const { uploadProps } = useManifestUpload();
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

  return (
    <>
      <LwPageHero
        title='Lightwell Lens'
        ouiaId='lightwell-coverage-header'
        description='Upload your SBOM or package manifest to assess your stack against the Lightwell Network catalog.'
      />
      {/* plXs matches the mXs margin LwPageHero applies to its inner title flex, keeping content left-aligned */}
      <PageSection
        aria-label='Lens Uploader'
        hasBodyWrapper={false}
        className={`${spacing.pt_0} ${spacing.pbLg} ${spacing.pxLg} ${spacing.plXs}`}
      >
        <Stack hasGutter style={{ maxWidth: 1200 }}>
          <StackItem>
            <ManifestUploadCard {...uploadProps} />
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};

export default ManifestUpload;
