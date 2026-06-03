import Fuse, { type IFuseOptions } from 'fuse.js';
import type { TrackLanguage } from '@/features/catalog/lib/track-languages';

export interface SearchEntry {
  slug: string;
  title: string;
  artist: string;
  language: TrackLanguage;
  hasChords: boolean;
  hasAudio: boolean;
  categorySlugs: string[];
  snippet: string;
  /** Diacritic- and apostrophe-stripped form of title + artist + snippet. */
  searchKey: string;
}

export interface SearchResult {
  entry: SearchEntry;
  /** 0 = perfect match, 1 = no match. Inverted for display ranking. */
  score: number;
  /** Field name → array of matched substring ranges, for highlighting. */
  matches: ReadonlyMap<keyof SearchEntry, readonly (readonly [number, number])[]>;
}

export interface SearchFilters {
  language?: TrackLanguage | 'all';
  hasChords?: boolean;
  hasAudio?: boolean;
  /** Restrict to entries that include ALL of these category slugs. */
  categorySlugs?: readonly string[];
}

const FUSE_OPTIONS: IFuseOptions<SearchEntry> = {
  // Order matters — title before artist before snippet, weighted accordingly.
  // `searchKey` carries a normalised form (no diacritics, no apostrophes) so
  // queries like "guiame" still hit "Guíame" and "Bahaullah" hits "Bahá'u'lláh".
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'artist', weight: 0.1 },
    { name: 'snippet', weight: 0.2 },
    { name: 'searchKey', weight: 0.3 },
    { name: 'categorySlugs', weight: 0.05 },
  ],
  // Relevance / typo tolerance. Lowered threshold trades recall for precision.
  threshold: 0.38,
  // Index n-grams of length 2 — accelerates "as-you-type" queries.
  minMatchCharLength: 2,
  // Returning indices is required for highlight rendering.
  includeMatches: true,
  includeScore: true,
  ignoreLocation: true,
  shouldSort: true,
  useExtendedSearch: false,
};

/**
 * Lightweight wrapper around Fuse that adds the post-filter step (language /
 * has-chords / has-audio / categories) and produces a typed `SearchResult[]`.
 */
export class SearchEngine {
  private readonly fuse: Fuse<SearchEntry>;
  constructor(private readonly entries: readonly SearchEntry[]) {
    this.fuse = new Fuse(entries, FUSE_OPTIONS);
  }

  /** All entries (used when the query is empty but filters are active). */
  all(): readonly SearchEntry[] {
    return this.entries;
  }

  search(query: string, filters: SearchFilters = {}, limit = 50): SearchResult[] {
    const trimmed = query.trim();
    let pool: SearchResult[];

    if (trimmed.length === 0) {
      pool = this.entries.map((entry) => ({
        entry,
        score: 0,
        matches: new Map(),
      }));
    } else {
      const fuseResults = this.fuse.search(trimmed, { limit: limit * 2 });
      pool = fuseResults.map((r) => {
        const matches = new Map<keyof SearchEntry, readonly (readonly [number, number])[]>();
        for (const m of r.matches ?? []) {
          if (m.key) {
            matches.set(
              m.key as keyof SearchEntry,
              m.indices.map(([a, b]) => [a, b] as const),
            );
          }
        }
        return { entry: r.item, score: r.score ?? 1, matches };
      });
    }

    return applyFilters(pool, filters).slice(0, limit);
  }
}

function applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
  const { language, hasChords, hasAudio, categorySlugs } = filters;
  const lang = !language || language === 'all' ? null : language;
  const needCats = categorySlugs && categorySlugs.length > 0 ? categorySlugs : null;

  return results.filter(({ entry }) => {
    if (lang && entry.language !== lang) return false;
    if (hasChords === true && !entry.hasChords) return false;
    if (hasAudio === true && !entry.hasAudio) return false;
    if (needCats) {
      for (const slug of needCats) {
        if (!entry.categorySlugs.includes(slug)) return false;
      }
    }
    return true;
  });
}

/** Lazy-load the static catalogue JSON. Cached after first call. */
let cached: Promise<SearchEntry[]> | null = null;

export function loadSearchEntries(): Promise<SearchEntry[]> {
  cached ??= import('@/data/search-index.json').then((mod) => mod.default as SearchEntry[]);
  return cached;
}
