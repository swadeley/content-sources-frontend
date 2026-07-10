import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import useRootPath from 'Hooks/useRootPath';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';

import { useAppContext } from 'middleware/AppContext';
import { DestinationKey, navigationPaths } from './navigationPaths';
import { ContentOrigin } from 'services/Content/ContentApi';

/**
 * Relocates to a destination based on the DestinationKey type.
 *
 * To add a new destination, look inside navigationPaths.ts file/
 * @param destinationKey - define the destination to be relocated to (eg. 'repositories')
 * @returns () => void
 */
export const useNavigateTo = (destinationKey: DestinationKey) => {
  const { contentOrigin, setContentOrigin, features } = useAppContext();
  const navigate = useNavigate();
  const rootPath = useRootPath();
  const repoUUID = useSafeUUIDParam('repoUUID');
  const templateUUID = useSafeUUIDParam('templateUUID');

  return useCallback(() => {
    const setDefaultFilter = () => {
      setContentOrigin([ContentOrigin.COMMUNITY, ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD]);
      destinationKey = 'nonRedHatRepositories';
    };

    // if destinationKey is FilterKey, apply the filter with setContentOrigin first
    switch (destinationKey) {
      case 'redHatRepositories':
        if (!features?.snapshots?.accessible) {
          setDefaultFilter();
          break;
        }
        setContentOrigin([ContentOrigin.REDHAT]);
        destinationKey = 'repositories';
        break;
      case 'customRepositories':
        if (!features?.snapshots?.accessible) {
          setDefaultFilter();
          break;
        }
        setContentOrigin([ContentOrigin.EXTERNAL, ContentOrigin.UPLOAD]);
        destinationKey = 'nonRedHatRepositories';
        break;
      case 'partnerRepositories':
        if (!features?.snapshots?.accessible) {
          setDefaultFilter();
          break;
        }
        setContentOrigin([ContentOrigin.COMMUNITY]);
        destinationKey = 'nonRedHatRepositories';
        break;
      case 'allRepositories':
        if (!features?.snapshots?.accessible) {
          setDefaultFilter();
          break;
        }
        setContentOrigin([
          ContentOrigin.EXTERNAL,
          ContentOrigin.UPLOAD,
          ContentOrigin.COMMUNITY,
          ContentOrigin.REDHAT,
        ]);
        destinationKey = 'nonRedHatRepositories';
        break;
    }
    const path = navigationPaths[destinationKey];
    return navigate(path({ rootPath, repoUUID, templateUUID, contentOrigin }));
  }, [contentOrigin, rootPath, repoUUID, templateUUID]);
};
