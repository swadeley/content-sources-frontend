import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  lightwellNavigationPaths,
  type LightwellDestinationKey,
  type LightwellNavigationParams,
} from './lightwellNavigationPaths';
import { useLightwellRootPath } from './useLightwellRootPath';

type NavigateArgs = Omit<LightwellNavigationParams, 'rootPath'>;

/**
 * Navigates to destinations using paths from lightwellNavigationPaths
 *
 * Add new destinations in lightwellNavigationPaths.ts
 */
export const useLightwellNavigateTo = () => {
  const navigate = useNavigate();
  const rootPath = useLightwellRootPath();
  const navigateTo = useCallback(
    (destination: LightwellDestinationKey, params: NavigateArgs = {}) => {
      navigate(lightwellNavigationPaths[destination]({ rootPath, ...params }));
    },
    [navigate, rootPath],
  );

  return { navigateTo };
};
