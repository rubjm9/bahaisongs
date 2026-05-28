'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  SearchEngine,
  loadSearchEntries,
  type SearchEntry,
  type SearchFilters,
  type SearchResult,
} from '@/features/catalog/lib/search-engine';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

interface UseSearchOptions {
  /** Debounce in ms. Default 30 ms — effectively instant but still batched. */
  debounceMs?: number;
  /** Max number of results to keep. */
  limit?: number;
  filters?: SearchFilters;
}

interface UseSearchReturn {
  /** True until the JSON index is loaded the first time. */
  loading: boolean;
  /** Top N results matching the (debounced) query and filters. */
  results: SearchResult[];
  /** Total catalogue size — for empty-state messaging. */
  totalEntries: number;
}

/**
 * Instant client-side search hook.
 *
 * The index loads once (lazy `import()` cached in `search-engine.ts`) and
 * filtering runs synchronously on every keystroke. 140 entries × Fuse n-grams
 * complete in well under 5 ms on a modern laptop, so we keep the debounce
 * minimal — just enough to batch React state updates inside a single render.
 *
 * When Supabase is connected (later phase), this hook is the single seam to
 * replace: a server-backed implementation can keep the same return shape.
 */
export function useSearch(query: string, opts: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 30, limit = 50, filters } = opts;
  const debounced = useDebouncedValue(query, debounceMs);
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSearchEntries().then((loaded) => {
      if (!cancelled) setEntries(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const engine = useMemo(() => (entries ? new SearchEngine(entries) : null), [entries]);

  const results = useMemo<SearchResult[]>(() => {
    if (!engine) return [];
    return engine.search(debounced, filters, limit);
  }, [engine, debounced, filters, limit]);

  return {
    loading: entries === null,
    results,
    totalEntries: entries?.length ?? 0,
  };
}
