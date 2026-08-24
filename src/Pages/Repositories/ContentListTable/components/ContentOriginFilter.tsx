import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { ContentOrigin } from '../../../../services/Content/ContentApi';
import React from 'react';
import { useAppContext } from '../../../../middleware/AppContext';

interface Props {
  contentOrigin: ContentOrigin[];
  setContentOrigin: React.Dispatch<React.SetStateAction<ContentOrigin[]>>;
}

/** API `community` origin is the shared EPEL and partner (for non-owners) catalog for this product. */
const COMMUNITY_ORIGIN = ContentOrigin.COMMUNITY;

const ContentOriginFilter = ({ contentOrigin, setContentOrigin }: Props) => {
  const { features } = useAppContext();
  const usePartnerTerminology =
    features?.partnerrepos?.enabled && features.partnerrepos?.accessible;
  const communityLabel = usePartnerTerminology ? 'Partner' : 'EPEL';

  return features?.snapshots?.accessible ? (
    <ToggleGroup aria-label='Default with single selectable'>
      <ToggleGroupItem
        text='Custom'
        buttonId='custom-repositories-toggle-button'
        data-ouia-component-id='custom-repositories-toggle'
        isSelected={
          contentOrigin.includes(ContentOrigin.EXTERNAL) &&
          contentOrigin.includes(ContentOrigin.UPLOAD)
        }
        onChange={() => {
          setContentOrigin((prev) => {
            const custom =
              contentOrigin.includes(ContentOrigin.EXTERNAL) &&
              contentOrigin.includes(ContentOrigin.UPLOAD);
            return custom
              ? prev.filter(
                  (origin) => origin !== ContentOrigin.EXTERNAL && origin !== ContentOrigin.UPLOAD,
                )
              : [...new Set([...prev, ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD])];
          });
        }}
      />
      <ToggleGroupItem
        text={communityLabel}
        buttonId='partner-repositories-toggle-button'
        data-ouia-component-id='partner-repositories-toggle'
        isSelected={contentOrigin.includes(COMMUNITY_ORIGIN)}
        onChange={() => {
          setContentOrigin((prev) =>
            prev.includes(COMMUNITY_ORIGIN)
              ? prev.filter((origin) => origin !== COMMUNITY_ORIGIN)
              : [...prev, COMMUNITY_ORIGIN],
          );
        }}
      />
      <ToggleGroupItem
        text='Red Hat'
        buttonId='redhat-repositories-toggle-button'
        data-ouia-component-id='redhat-repositories-toggle'
        isSelected={contentOrigin.includes(ContentOrigin.REDHAT)}
        onChange={() => {
          setContentOrigin((prev) =>
            prev.includes(ContentOrigin.REDHAT)
              ? prev.filter((origin) => origin !== ContentOrigin.REDHAT)
              : [...prev, ContentOrigin.REDHAT],
          );
        }}
      />
    </ToggleGroup>
  ) : null;
};

export default ContentOriginFilter;
