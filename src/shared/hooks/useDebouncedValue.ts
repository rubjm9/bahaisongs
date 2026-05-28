'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of
 * stable input. Setting `delay` to 0 disables debouncing entirely — useful for
 * instant-as-you-type search where the dataset is small enough to filter
 * synchronously on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return;
    }
    const id = setTimeout(() => setDebounced(value), delay);
    return () => {
      clearTimeout(id);
    };
  }, [value, delay]);

  return debounced;
}
