export type PackageIdentity = {
  name: string;
  group?: string;
  isPython?: boolean;
};

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

/**
 * Formats package coordinates for clipboard copy
 *
 * Examples:
 * ({ name: 'json', group: 'org.json' }, '1.2.3.rhlw-00001') -> org.json:json:1.2.3.rhlw-00001
 * ({ name: 'requests', isPython: true }, '1.2.3') -> pip install requests==1.2.3
 */
export const formatReleaseCopyText = (
  { name, group = '', isPython = false }: PackageIdentity,
  version: string,
) => (isPython ? `pip install ${name}==${version}` : `${group}:${name}:${version}`);
