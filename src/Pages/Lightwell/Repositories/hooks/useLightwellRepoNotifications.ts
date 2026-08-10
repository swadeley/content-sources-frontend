import { useCallback } from 'react';
import { useFlag } from '@unleash/proxy-client-react';

import {
  useNotificationSubscriptionsQuery,
  useUpdateNotificationSubscriptionsMutation,
} from 'services/Notifications/NotificationsQueries';
import type { NotificationSeverity } from 'services/Notifications/NotificationsApi';
import { LightwellNotificationSeverity, INSTANT_EMAIL_SUBSCRIPTION_TYPE } from '../../constants';

import { useLightwellDemo } from '../../LightwellDemoContext';

const SEVERITY_THRESHOLD_MAP: Record<LightwellNotificationSeverity, NotificationSeverity[]> = {
  critical: ['critical'],
  high: ['critical', 'important'],
  medium: ['critical', 'important', 'moderate'],
  low: ['critical', 'important', 'moderate', 'low'],
};

export const mapSeveritiesToApi = (
  threshold: LightwellNotificationSeverity,
): NotificationSeverity[] => SEVERITY_THRESHOLD_MAP[threshold];

export const useLightwellRepoNotifications = (shouldFetch = true) => {
  const isDemo = useLightwellDemo();
  const shouldExposeNotifications = useFlag('content-sources.lightwell-notifications.enabled');
  const canFetch = shouldExposeNotifications && !isDemo && shouldFetch;

  const query = useNotificationSubscriptionsQuery('lightwell', 'lightwell', canFetch);

  const { mutate, isPending, variables } = useUpdateNotificationSubscriptionsMutation(
    'lightwell',
    'lightwell',
  );

  const isRepoSubscribed = useCallback(
    (eventType: string): boolean => {
      if (!query.data) return false;
      for (const bundle of query.data) {
        for (const app of bundle.applications) {
          const matchingEventType = app.event_types.find(
            ({ event_type }) => event_type === eventType,
          );
          if (!matchingEventType) continue;
          const emailChannel = matchingEventType.subscriptions.find(
            ({ subscription_type }) => subscription_type === INSTANT_EMAIL_SUBSCRIPTION_TYPE,
          );
          // API returns all event types regardless of subscription, so check channel severities to determine opt-in
          return (emailChannel?.subscribed_severities?.length ?? 0) > 0;
        }
      }
      return false;
    },
    [query.data],
  );

  const setRepoSubscribed = useCallback(
    (eventType: string, severities: NotificationSeverity[]) => {
      if (!canFetch) return;
      mutate([
        {
          event_type: eventType,
          subscriptions: [
            {
              subscription_type: INSTANT_EMAIL_SUBSCRIPTION_TYPE,
              subscribed_severities: severities,
            },
          ],
        },
      ]);
    },
    [canFetch, mutate],
  );

  const pendingEventType = isPending ? variables?.[0]?.event_type : undefined;

  return {
    isRepoSubscribed,
    setRepoSubscribed,
    isLoading: canFetch && query.isLoading,
    isError: canFetch && query.isError,
    pendingEventType,
  };
};
