import { act, renderHook } from '@testing-library/react';
import { useLightwellNavigateTo } from './useLightwellNavigateTo';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('./useLightwellRootPath', () => ({
  useLightwellRootPath: () => '/root',
}));

beforeEach(() => {
  mockNavigate.mockClear();
});

describe('useLightwellNavigateTo', () => {
  it('navigates to repositories', () => {
    const { result } = renderHook(() => useLightwellNavigateTo());

    act(() => result.current.navigateTo('repositories'));

    expect(mockNavigate).toHaveBeenCalledWith('/root');
  });

  it('navigates to repository packages', () => {
    const { result } = renderHook(() => useLightwellNavigateTo());

    act(() => result.current.navigateTo('repositoryPackages', { repoSlug: 'repo-slug' }));

    expect(mockNavigate).toHaveBeenCalledWith('/root/repo-slug');
  });

  it('navigates to package details with group ID', () => {
    const { result } = renderHook(() => useLightwellNavigateTo());

    act(() =>
      result.current.navigateTo('packageDetails', {
        repoSlug: 'repo-slug',
        packageName: 'package-name',
        groupId: 'org.group',
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith('/root/repo-slug/org.group/package-name');
  });

  it('navigates to package details without group ID', () => {
    const { result } = renderHook(() => useLightwellNavigateTo());

    act(() =>
      result.current.navigateTo('packageDetails', {
        repoSlug: 'repo-slug',
        packageName: 'package-name',
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith('/root/repo-slug/package-name');
  });
});
