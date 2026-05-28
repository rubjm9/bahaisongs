import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  it('returns the initial value synchronously', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 100));
    expect(result.current).toBe('a');
  });

  it('delays updates by the given debounce', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 100), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'ab' });
    expect(result.current).toBe('a');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(result.current).toBe('ab');
    vi.useRealTimers();
  });

  it('updates immediately when delay is 0', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 0), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' });
    expect(result.current).toBe('b');
  });

  it('collapses bursts of changes into a single update', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 50), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'ab' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    rerender({ v: 'abc' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    rerender({ v: 'abcd' });
    expect(result.current).toBe('a');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current).toBe('abcd');
    vi.useRealTimers();
  });
});
