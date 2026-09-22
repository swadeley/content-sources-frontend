import { capitalize } from 'lodash';
import { CONTENT_TYPE_PARAMETERS, LIGHTWELL_ORIGIN, REPOSITORY_DESCRIPTIONS } from './constants';

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
