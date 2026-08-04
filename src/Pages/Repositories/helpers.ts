import { ContentItem, ContentOrigin } from '../../services/Content/ContentApi';
import dayjs from 'dayjs';

export const hasOrigin = (value: unknown): value is { origin?: ContentOrigin } =>
  typeof value === 'object' && value !== null && 'origin' in value;

export const lastIntrospectionDisplay = (time?: string): string =>
  time === '' || time === undefined ? 'Never' : dayjs(time).fromNow();

export const showPendingTooltip = (
  snapshotStatus: string | undefined,
  introspectStatus: string | undefined,
) => {
  if (!snapshotStatus && !introspectStatus) {
    return 'Introspection or snapshotting is in progress';
  } else if (snapshotStatus === 'running' || snapshotStatus === 'pending') {
    return 'Snapshotting is in progress';
  } else if (introspectStatus === 'Pending') {
    return 'Introspection is in progress';
  }
};

/**
 * Converts a version name like "RHEL 8.5" to "8.5" for use in the API. Returns an empty string if no version is found.
 */
export const versionNameToApiValue = (versionName: string) => versionName.split(' ')[1] ?? '';

export const isEPELUrl = (repoUrl: string) => {
  const epelUrls = [
    'https://dl.fedoraproject.org/pub/epel/10/Everything/x86_64/',
    'https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/',
    'https://dl.fedoraproject.org/pub/epel/8/Everything/x86_64/',
    'https://dl.fedoraproject.org/pub/epel/10/Everything/aarch64/',
    'https://dl.fedoraproject.org/pub/epel/9/Everything/aarch64/',
    'https://dl.fedoraproject.org/pub/epel/8/Everything/aarch64/',
  ];
  return epelUrls.includes(repoUrl);
};

export const isEPELRepository = (repo: Pick<ContentItem, 'origin' | 'url'>): boolean =>
  repo.origin === ContentOrigin.COMMUNITY && isEPELUrl(repo.url);
