import { getPublishRuleOnSnapshots } from './getPublishAction';
import { SnapshotItem } from 'services/Content/ContentApi';

const makeSnapshot = (overrides: Partial<SnapshotItem> = {}): SnapshotItem => ({
  uuid: 'snap-1',
  created_at: '2024-01-01T00:00:00Z',
  distribution_path: '/path',
  content_counts: { 'rpm.package': 5 },
  added_counts: {},
  removed_counts: {},
  repository_name: 'repo',
  repository_uuid: 'repo-uuid',
  published: false,
  ...overrides,
});

describe('getPublishRuleOnSnapshots', () => {
  it('passes all checks for a modifiable, publishable, unpublished snapshot with packages', () => {
    const snapshot = makeSnapshot();

    expect(getPublishRuleOnSnapshots([snapshot], true, true)).toEqual({
      isDisabled: false,
      reason: 'passed-all-checks',
    });
  });

  it('is disabled with "no-permission" when the user cannot modify the repository', () => {
    const snapshot = makeSnapshot();

    expect(getPublishRuleOnSnapshots([snapshot], false, true)).toEqual({
      isDisabled: true,
      reason: 'no-permission',
    });
  });

  it('is disabled with "zero-packages" when the snapshot has no packages', () => {
    const snapshot = makeSnapshot({ content_counts: {} });

    expect(getPublishRuleOnSnapshots([snapshot], true, true)).toEqual({
      isDisabled: true,
      reason: 'zero-packages',
    });
  });
});
