import * as Yup from 'yup';
import { EUS, E4S, EEUS, LAST_FULL_SUPPORT_MINOR_VERSION, STANDARD_STREAM_PATH } from './constants';
import { RoadmapLifecycleResponse } from 'services/Roadmap/RoadmapApi';

export const extractMajorVersion = (extendedReleaseVersion: string) =>
  extendedReleaseVersion.split('.')[0];

/**
 * Extracts the minor version from an extended release version string.
 * Converts "9.6" → "6" to match Patch API's os_minor format (just the minor number, not the full version).
 *
 * @param extendedReleaseVersion - Full version string (e.g., "9.6", "8.10")
 * @returns The minor version component (e.g., "6", "10")
 */
export const extractMinorVersion = (extendedReleaseVersion: string) =>
  extendedReleaseVersion.split('.')[1];

export const getRedHatCoreRepoUrls = (
  arch?: string,
  majorVersion?: string,
  releaseStream?: string,
  minorVersion?: string,
): string[] => {
  let stream = releaseStream || STANDARD_STREAM_PATH;
  const versionNumber = stream === STANDARD_STREAM_PATH ? majorVersion : minorVersion;

  if (!arch || !majorVersion || (stream !== STANDARD_STREAM_PATH && !minorVersion)) {
    return [];
  }

  // 'eeus' uses 'e4s' in the url path
  if (stream === EEUS) {
    stream = E4S;
  }

  return [
    `https://cdn.redhat.com/content/${stream}/rhel${majorVersion}/${versionNumber}/${arch}/appstream/os/`,
    `https://cdn.redhat.com/content/${stream}/rhel${majorVersion}/${versionNumber}/${arch}/baseos/os/`,
  ];
};

/**
 * Determines if a system has an RHSM version lock set.
 * Systems with version locks (e.g., locked to RHEL 9.6 via RHSM) cannot be assigned
 * to standard templates but can be assigned to extended support templates.
 *
 * @param rhsm - The RHSM version value from the Patch API system attributes.
 *               Empty string means no version lock (rolling release).
 *               Non-empty value (e.g., "9.6", "8.10") means a system is version-locked.
 * @returns True if the system is version-locked, false if on rolling release
 */
export const isVersionLockedSystem = (rhsm: string) => !!rhsm;

/** Checks if a template uses extended support (EUS or E4S) based on its configuration. */
export const isExtendedSupportTemplate = (
  extended_release?: string,
  extended_release_version?: string,
) => !!(extended_release && extended_release_version);

export const canAssignSystemToTemplate = (
  rhsm: string,
  satelliteManaged: boolean,
  imageBased: boolean,
  notAlreadyAssigned: boolean,
  templateUsesExtendedSupport: boolean,
) =>
  notAlreadyAssigned &&
  !satelliteManaged &&
  !imageBased &&
  // Standard templates: can only be assigned to rolling release systems (not version-locked)
  // Extended support templates: can be assigned to any system (version-locked or rolling)
  (templateUsesExtendedSupport || !isVersionLockedSystem(rhsm));

/** Extracts the abbreviation from parentheses, e.g., "Extended Update Support (EUS)" to "EUS". */
export const abbreviateStreamName = (streamName: string) =>
  streamName.match(/\(([^)]+)\)/)?.[1] ?? '';

export const isMinorVersionOfMajor = (minorVersion?: string, majorVersion?: string) => {
  if (minorVersion && majorVersion) {
    return minorVersion.split('.')[0] === majorVersion;
  }
  return false;
};

export const isArchManuallyDisabled = (
  arch: string,
  releaseStream: string,
  version: string,
): boolean => releaseStream === EEUS && version === '9' && arch === 'x86_64';

export const TemplateValidationSchema = Yup.object().shape({
  name: Yup.string().max(255, 'Too Long!').required('Required'),
  description: Yup.string().max(255, 'Too Long!'),
});

export const TEMPLATE_NAME_TAKEN_MESSAGE = 'A template with this name already exists.';

const dateToMonthYear = (date: string | number | Date): string =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

export const describeOSVersionDropdownItem = (
  metadata: RoadmapLifecycleResponse | undefined,
  isError: boolean,
  major: number,
): string | undefined => {
  if (isError || !metadata) {
    return undefined;
  }

  const full = metadata?.data.find(
    (x) => x.major === major && x.minor == LAST_FULL_SUPPORT_MINOR_VERSION,
  );
  const fullString = full ? dateToMonthYear(full.end_date) : 'N/A';

  const maint = metadata?.data.find((x) => x.major === major && x.minor == null); // using == on purpose to cover `undefined`
  const maintString = maint ? dateToMonthYear(maint.end_date) : 'N/A';

  return `Full support ends: ${fullString} | Maintenance support ends: ${maintString}`;
};

export const describeOSVersionDropdownItemExtended = (
  metadata: RoadmapLifecycleResponse | undefined,
  isError: boolean,
  extendedReleaseKind: string | undefined,
  version: string,
): string | undefined => {
  if (isError || !extendedReleaseKind) {
    return undefined;
  }

  const [major, minor] = version.split('.');
  const ver = metadata?.data.find(
    (x) => x.major === parseInt(major) && x.minor === parseInt(minor),
  );
  if (!ver) {
    return undefined;
  }

  switch (extendedReleaseKind) {
    case EUS:
      return `Support ends: ${dateToMonthYear(ver.end_date_eus ?? ver.end_date)}`;
    case E4S:
      return `Support ends: ${dateToMonthYear(ver.end_date_e4s ?? ver.end_date)}`;
    case EEUS: {
      const startDate = new Date(ver.start_date);
      const offsetDate = new Date(startDate.setMonth(startDate.getMonth() + 48)); // ref: https://access.redhat.com/support/policy/updates/errata#Enhanced_Extended_Update_Support
      return `Support ends: ${dateToMonthYear(offsetDate)}`;
    }
    default:
      return undefined; // unknown extended release kind
  }
};
