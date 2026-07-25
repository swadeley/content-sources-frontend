import { useUserPreferencesQuery, UserPreference } from 'services/Lightwell/UserPreferencesQueries';

import {
  DEFAULT_LIGHTWELL_NOTIFICATION_PREFS,
  LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
  LightwellNotificationPrefs,
  LightwellNotificationSeverity,
} from '../../constants';

export const parseLightwellNotificationPrefs = (
  preferences: UserPreference[],
): LightwellNotificationPrefs => {
  const enabledValue = preferences.find(
    ({ label }) => label === LIGHTWELL_NOTIFICATION_ENABLED_LABEL,
  )?.value;
  const minimumValue = preferences.find(
    ({ label }) => label === LIGHTWELL_NOTIFICATION_MINIMUM_LABEL,
  )?.value;

  return {
    enabled: enabledValue === 'true',
    minimumSeverity:
      (minimumValue as LightwellNotificationSeverity | undefined) ??
      DEFAULT_LIGHTWELL_NOTIFICATION_PREFS.minimumSeverity,
  };
};

export const useLightwellNotificationPrefs = (shouldFetch = true) => {
  const query = useUserPreferencesQuery(shouldFetch);
  const prefs = parseLightwellNotificationPrefs(query.data ?? []);

  return {
    ...prefs,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
