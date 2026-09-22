import { formatReleaseCopyText, formatReleaseDate } from './format';

describe('formatReleaseDate', () => {
  it('formats an ISO date as DD MMM YYYY', () => {
    expect(formatReleaseDate('2024-03-14T00:00:00Z')).toBe('14 Mar 2024');
  });

  it('returns a dash when the date is missing', () => {
    expect(formatReleaseDate()).toBe('—');
    expect(formatReleaseDate('')).toBe('—');
  });
});

describe('formatReleaseCopyText', () => {
  it('formats maven coordinates', () => {
    expect(formatReleaseCopyText({ name: 'json', group: 'org.json' }, '1.2.3.rhlw-00001')).toBe(
      'org.json:json:1.2.3.rhlw-00001',
    );
  });

  it('formats a pip install command for python packages', () => {
    expect(formatReleaseCopyText({ name: 'requests', isPython: true }, '1.2.3')).toBe(
      'pip install requests==1.2.3',
    );
  });
});
