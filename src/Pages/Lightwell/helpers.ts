import { capitalize } from 'lodash';
import { CONTENT_TYPE_PARAMETERS, LIGHTWELL_ORIGIN, REPOSITORY_DESCRIPTIONS } from './constants';
import { RepositoryPackageItem } from 'services/Content/ContentApi';

const getContentTypeParameters = (contentType?: string) => {
  const normalized = contentType?.toLowerCase();
  if (!normalized) return undefined;
  return CONTENT_TYPE_PARAMETERS[normalized];
};

export const getEcosystemFromContentType = (contentType?: string): string | undefined =>
  getContentTypeParameters(contentType)?.ecosystem;

export const getRepositoryDescription = (
  contentType?: string,
  securityLevel?: string,
): string | undefined => {
  const normalizedType = contentType?.toLowerCase();
  const normalizedLevel = securityLevel?.toLowerCase();
  if (!normalizedType || !normalizedLevel) return undefined;
  return REPOSITORY_DESCRIPTIONS[normalizedType]?.[normalizedLevel];
};

export const formatRepositoryName = (
  contentType?: string,
  securityLevel?: string,
  fallbackName?: string,
) => {
  const ecosystem = getEcosystemFromContentType(contentType);

  if (ecosystem && securityLevel) {
    return `${capitalize(ecosystem)} ${capitalize(securityLevel)}`;
  }

  return fallbackName || '—';
};

// Creates readable path slug from repository's ecosystem and security level
export const getRepositoryPathSlug = (contentType?: string, securityLevel?: string): string => {
  const ecosystem = getEcosystemFromContentType(contentType)?.toLowerCase();
  const level = securityLevel?.toLowerCase();

  if (!ecosystem || !level) {
    return '';
  }

  return `${ecosystem}-${level}`;
};

export const getSlugFromRepositoryName = (name: string): string => {
  const path = name.replace(`${LIGHTWELL_ORIGIN}/`, '').replace('/', '-');
  return path || '';
};

// Converts URL path slug to its Lightwell repository name
export const getRepositoryNameFromPathSlug = (slug: string): string => {
  const normalized = slug.toLowerCase();
  const separatorIndex = normalized.indexOf('-');

  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
    return '';
  }

  const ecosystem = normalized.slice(0, separatorIndex);
  const securityLevel = normalized.slice(separatorIndex + 1);

  return `${LIGHTWELL_ORIGIN}/${ecosystem}/${securityLevel}`;
};

/**
 * Removes the Lightwell release suffix from a version.
 *
 * Example:
 * 1.2.3.rhlw-00001 -> 1.2.3
 */
export const stripLightwellVersionSuffix = (version: string): string =>
  version.replace(/(?:\.rhlw-|\+rhlw\.).*$/i, '');

export const pythonLightwellRelease = (version: string): string =>
  version.slice(stripLightwellVersionSuffix(version).length);

/**
 * Extracts a release number from a Lightwell version or release
 *
 * Examples:
 * 1.2.3.rhlw-0001 -> 1
 * rhlw-0002 -> 2
 */
export const lightwellReleaseNum = (versionOrRelease: string): number =>
  parseInt(versionOrRelease.match(/rhlw[-.](\d+)/i)?.[1] ?? '0', 10);

/**
 * Sorts versions in descending semantic order
 *
 * Example:
 * 1.10.2,         1.11.1
 * 1.9.2,    ->    1.10.2
 * 1.11.1          1.9.2
 */
export const sortVersionsDesc = (versions: string[]) =>
  [...versions].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' }),
  );

/**
 * Compares two Lightwell versions in descending order, ignoring the .rhlw suffix
 *
 * Example:
 * 1.2.3.rhlw-0003 == 1.2.3.rhlw-0002
 * 2.3.4.rhlw-0001 > 2.3.3.rhlw-0002
 */
export const compareVersionsDesc = (a: string, b: string) =>
  stripLightwellVersionSuffix(b).localeCompare(stripLightwellVersionSuffix(a), undefined, {
    numeric: true,
    sensitivity: 'base',
  });

/**
 * Compares Lightwell releases in descending order. Orders initially by
 * version (ignoring the .rhlw suffix). If two releases have the same
 * version, uses the release number as a tiebreaker
 *
 * Example:
 * 1.2.3.rhlw-0001
 * 1.2.2.rhlw-0009
 * 1.2.2.rhlw-0008
 */
export const compareReleasesDesc = (
  a: RepositoryPackageItem['latest_releases'][number],
  b: RepositoryPackageItem['latest_releases'][number],
) => {
  const versionComparison = compareVersionsDesc(a.version, b.version);

  if (versionComparison !== 0) {
    return versionComparison;
  }

  return lightwellReleaseNum(b.release) - lightwellReleaseNum(a.release);
};

/**
 * Transforms published distribution URL by replacing /api/pulp-content/lightwell with /lightwell
 *
 * Example:
 * https://packages.redhat.com/api/pulp-content/lightwell/java/validated
 * -> https://packages.redhat.com/lightwell/java/validated
 * https://packages.redhat.com/api/pulp-content/public-lightwell-demo/python/validated/simple
 * -> https://packages.redhat.com/lightwell/public-lightwell-demo/python/validated/simple
 */
export const formatDistributionUrl = (url: string): string =>
  url
    .replace('/api/pulp-content/public-lightwell-demo', '/lightwell/public-lightwell-demo')
    .replace('/api/pulp-content/lightwell', '/lightwell');

/**
 * Formats an ISO date string as DD MMM YYYY
 *
 * Example:
 * 2024-03-14T00:00:00Z -> 14 Mar 2024
 */
export const formatReleaseDate = (iso?: string) => {
  if (!iso) return '—';

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
