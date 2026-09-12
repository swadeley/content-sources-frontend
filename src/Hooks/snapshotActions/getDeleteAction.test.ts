import { getDeleteRuleOnSnapshots } from './getDeleteAction';
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

describe('getDeleteRuleOnSnapshots', () => {
  it('passes all checks for a modifiable, unpublished snapshot that is not the last one', () => {
    const snapshot = makeSnapshot();

    expect(getDeleteRuleOnSnapshots([snapshot], true, 3)).toEqual({
      isDisabled: false,
      reason: 'passed-all-checks',
    });
  });

  it('is disabled with "no-permission" when the user cannot modify the repository', () => {
    const snapshot = makeSnapshot();

    expect(getDeleteRuleOnSnapshots([snapshot], false, 3)).toEqual({
      isDisabled: true,
      reason: 'no-permission',
    });
  });

  it('is disabled with "already-published" when a selected snapshot is published', () => {
    const snapshot = makeSnapshot({ published: true });

    expect(getDeleteRuleOnSnapshots([snapshot], true, 3)).toEqual({
      isDisabled: true,
      reason: 'already-published',
    });
  });
});
