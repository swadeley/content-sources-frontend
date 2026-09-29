import { formatReleaseCopyText, formatReleaseDate, getPackageCoordinate } from './format';

describe('formatReleaseDate', () => {
  it('formats an ISO date as DD MMM YYYY', () => {
    expect(formatReleaseDate('2024-03-14T00:00:00Z')).toBe('14 Mar 2024');
  });

  it('returns a dash when the date is missing', () => {
    expect(formatReleaseDate()).toBe('—');
    expect(formatReleaseDate('')).toBe('—');
  });
});

describe('getPackageCoordinate', () => {
  it('formats Maven names with either ecosystem flag', () => {
    expect(getPackageCoordinate({ name: 'json', group: 'org.json', isMaven: true })).toBe(
      'org.json:json',
    );
    expect(getPackageCoordinate({ name: 'json', group: 'org.json', isPython: false })).toBe(
      'org.json:json',
    );
    expect(getPackageCoordinate({ name: 'json', isMaven: true })).toBe('json');
    expect(getPackageCoordinate({ name: 'json', group: '', isMaven: true })).toBe('json');
  });

  it('uses only the package name for Python, even when a group is present', () => {
    expect(getPackageCoordinate({ name: 'requests', group: 'ignored', isPython: true })).toBe(
      'requests',
    );
    expect(getPackageCoordinate({ name: 'requests', group: 'ignored', isMaven: false })).toBe(
      'requests',
    );
  });
});

describe('formatReleaseCopyText', () => {
  it('formats maven coordinates', () => {
    expect(
      formatReleaseCopyText({ name: 'json', group: 'org.json', isMaven: true }, '1.2.3.rhlw-00001'),
    ).toBe('org.json:json:1.2.3.rhlw-00001');
  });

  it('formats a pip install command for python packages', () => {
    expect(formatReleaseCopyText({ name: 'requests', isPython: true }, '1.2.3')).toBe(
      'pip install requests==1.2.3',
    );
  });
});
