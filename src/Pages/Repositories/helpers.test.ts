import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  hasOrigin,
  isEPELRepository,
  lastIntrospectionDisplay,
  showPendingTooltip,
  versionNameToApiValue,
} from './helpers';
import { ContentOrigin } from 'services/Content/ContentApi';

dayjs.extend(relativeTime);

describe('hasOrigin', () => {
  it('should return true if the value has an origin property', () => {
    expect(hasOrigin({ origin: 'Red Hat' })).toBe(true);
  });

  it("should return false if the value doesn't have an origin property", () => {
    expect(hasOrigin({})).toBe(false);
  });

  it('should return false for null and non-object values', () => {
    expect(hasOrigin(null)).toBe(false);
    expect(hasOrigin(undefined)).toBe(false);
    expect(hasOrigin('string')).toBe(false);
  });
});

describe('lastIntrospectionDisplay', () => {
  it('should return "Never" for an empty string', () => {
    expect(lastIntrospectionDisplay('')).toBe('Never');
  });

  it('should return "Never" for undefined', () => {
    expect(lastIntrospectionDisplay(undefined)).toBe('Never');
  });

  it('should return a relative time string for a valid timestamp', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(lastIntrospectionDisplay(fiveMinutesAgo)).toBe('5 minutes ago');
  });
});

describe('showPendingTooltip', () => {
  it('should indicate snapshotting when snapshot status is running', () => {
    expect(showPendingTooltip('running', undefined)).toBe('Snapshotting is in progress');
  });

  it('should indicate snapshotting when snapshot status is pending', () => {
    expect(showPendingTooltip('pending', undefined)).toBe('Snapshotting is in progress');
  });

  it('should indicate introspection when introspect status is Pending', () => {
    expect(showPendingTooltip(undefined, 'Pending')).toBe('Introspection is in progress');
  });

  it('should indicate both when neither status is provided', () => {
    expect(showPendingTooltip(undefined, undefined)).toBe(
      'Introspection or snapshotting is in progress',
    );
  });

  it('should return undefined when statuses do not match any condition', () => {
    expect(showPendingTooltip('completed', 'Valid')).toBeUndefined();
  });
});

describe('versionNameToApiValue', () => {
  it('should return the version number if the version name contains a space', () => {
    // The backend always returns the version name in this format: `RHEL X`
    expect(versionNameToApiValue('RHEL 8.5')).toBe('8.5');
  });

  it('should return an empty string if the version name does not satisfy the expected format', () => {
    expect(versionNameToApiValue('RHEL')).toBe('');
  });
});

describe('isEPELRepository', () => {
  it('should be true for community origin and EPEL URL', () => {
    expect(
      isEPELRepository({
        origin: ContentOrigin.COMMUNITY,
        url: 'https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/',
      }),
    ).toBe(true);
  });

  it('should be false for non-EPEL URL ', () => {
    expect(isEPELRepository({ origin: ContentOrigin.COMMUNITY, url: 'https://example.com' })).toBe(
      false,
    );
  });

  it('should be false for non-community origin and non-EPEL URL', () => {
    expect(isEPELRepository({ origin: ContentOrigin.EXTERNAL, url: 'https://example.com' })).toBe(
      false,
    );
  });
});
