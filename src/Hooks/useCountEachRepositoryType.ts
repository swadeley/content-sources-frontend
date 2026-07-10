import { ContentOrigin } from 'services/Content/ContentApi';
import { useRepositoryCount } from 'services/Content/ContentQueries';

/**
 * Returns total sum of repositories in each of the 3 types:
 * - total sum of Redhat repositories
 * - total sum of Partner repositories
 * - total sum of Custom repositories for an organization
 */
const useCountEachRepositoryType = () => {
  const { data: redhatCount = 0, isLoading: isLoadingRedhat } = useRepositoryCount([
    ContentOrigin.REDHAT,
  ]);
  const { data: partnerCount = 0, isLoading: isLoadingPartner } = useRepositoryCount([
    ContentOrigin.COMMUNITY,
  ]);
  const { data: customCount = 0, isLoading: isLoadingCustom } = useRepositoryCount([
    ContentOrigin.EXTERNAL,
    ContentOrigin.UPLOAD,
  ]);

  return {
    redhatCount,
    partnerCount,
    customCount,
    isLoading: isLoadingRedhat || isLoadingPartner || isLoadingCustom,
  };
};

export { useCountEachRepositoryType };
