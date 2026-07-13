import { act, renderHook, waitFor } from '@testing-library/react';

import { useLightwellPackagesParams } from './useLightwellPackagesParams';

const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useSearchParams: jest.fn(),
  useNavigationType: jest.fn(() => 'REPLACE'),
}));

jest.mock('Hooks/useDebounce', () => (value: string) => value);

import { useSearchParams } from 'react-router-dom';

const mockSearchParams = (query = '') => {
  const searchParams = new URLSearchParams(query);
  (useSearchParams as jest.Mock).mockReturnValue([searchParams, mockSetSearchParams]);
  return searchParams;
};

beforeEach(() => {
  mockSetSearchParams.mockClear();
  mockSearchParams();
});

it('initializes from URL search params', () => {
  mockSearchParams('search=test&page=2');

  const { result } = renderHook(() => useLightwellPackagesParams());

  expect(result.current.searchQuery).toBe('test');
  expect(result.current.debouncedSearch).toBe('test');
  expect(result.current.page).toBe(2);
  expect(result.current.packagesParams).toEqual({ search: 'test', page: 2 });
});

it('resets page to 1 when search changes', async () => {
  mockSearchParams('search=test1&page=3');

  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setSearchQuery('test2');
  });

  await waitFor(() => {
    expect(result.current.page).toBe(1);
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test2'), {
      replace: true,
    });
  });
});

it('updates the URL params when search changes', async () => {
  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setSearchQuery('test');
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test'), {
      replace: true,
    });
  });
});

it('updates the URL params when page changes', async () => {
  mockSearchParams('search=test&page=1');

  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setPage(3);
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test&page=3'), {
      replace: true,
    });
  });
});

it('clears the URL params when search is cleared', async () => {
  mockSearchParams('search=test&page=2');

  const { result } = renderHook(() => useLightwellPackagesParams());

  act(() => {
    result.current.setSearchQuery('');
  });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams(), { replace: true });
  });
});

it('defaults invalid page param from the URL to 1', async () => {
  mockSearchParams('search=test&page=abc');

  const { result } = renderHook(() => useLightwellPackagesParams());

  expect(result.current.searchQuery).toBe('test');
  expect(result.current.debouncedSearch).toBe('test');
  expect(result.current.page).toBe(1);
  expect(result.current.packagesParams).toEqual({ search: 'test', page: 1 });

  await waitFor(() => {
    expect(mockSetSearchParams).toHaveBeenCalledWith(new URLSearchParams('search=test'), {
      replace: true,
    });
  });
});
