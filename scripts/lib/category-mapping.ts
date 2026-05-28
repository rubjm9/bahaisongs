/**
 * Map WordPress taxonomy slugs (categories + post_tag) to BahaiSongs
 * `categories` table slugs as seeded in `supabase/seed.sql`.
 *
 * Unknown WP taxonomies are dropped silently so the import remains tolerant of
 * future taxonomy drift. Add new mappings here as the catalogue grows.
 */

export interface MappedCategory {
  slug: string;
  /** When set, the WP taxonomy also implies a language for the track. */
  language?: 'es' | 'en' | 'pt';
}

const MAP: Record<string, MappedCategory> = {
  // WP categories
  canciones: { slug: 'cancion' },
  'canciones-espanol': { slug: 'cancion', language: 'es' },
  oraciones: { slug: 'oracion' },
  english: { slug: 'cancion', language: 'en' },
  song: { slug: 'cancion' },
  album: { slug: 'cancion' },
  wave: { slug: 'cancion' },
  // press / uncategorized are dropped

  // WP tags → categories
  'con-audio': { slug: 'con-audio' },
  'con-acordes': { slug: 'con-acordes' },
  tranquila: { slug: 'tranquila' },
  ritmica: { slug: 'ritmica' },
  'muy-ritmica': { slug: 'muy-ritmica' },
  'texto-sagrado': { slug: 'texto-sagrado' },
  'palabra-oculta': { slug: 'palabra-oculta' },
  bab: { slug: 'bab' },
  bahaullah: { slug: 'bahaullah' },
  'abdul-baha': { slug: 'abdulbaha' },
  'bicentenario-bab': { slug: 'bicentenario-bab' },
  espanol: { slug: 'cancion', language: 'es' },
  cancion: { slug: 'cancion' },
};

/** Returns the BahaiSongs category mapping for a WP taxonomy slug, or `null`. */
export function mapWpTaxonomy(slug: string): MappedCategory | null {
  return MAP[slug.toLowerCase()] ?? null;
}

/** Aggregate a list of WP taxonomy slugs to unique category slugs + inferred language. */
export function aggregateCategories(wpSlugs: readonly string[]): {
  categorySlugs: string[];
  language: 'es' | 'en' | 'pt' | undefined;
} {
  const out = new Set<string>();
  let language: 'es' | 'en' | 'pt' | undefined;
  for (const raw of wpSlugs) {
    const m = mapWpTaxonomy(raw);
    if (!m) continue;
    out.add(m.slug);
    if (m.language && !language) language = m.language;
  }
  return { categorySlugs: [...out], language };
}
