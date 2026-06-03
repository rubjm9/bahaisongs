/**
 * Helpers for Baha'i Blog YouTube batch import.
 */

export interface BahaiblogRawEntry {
  titulo: string;
  artista: string;
  youtube_url: string | null;
  letra: string | null;
  acordes: string | null;
  categoria: string;
  estilo: string;
  idioma: string;
  fuente: string | null;
  url_pagina: string;
}

export interface BahaiblogNormalizedTrack {
  slug: string;
  title: string;
  artistName: string;
  artistSlug: string;
  youtubeId: string;
  language: 'en' | 'es' | 'hu';
  categorySlugs: string[];
  lyricsPlain: string | null;
  hasChords: boolean;
  sourcePageUrl: string;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseYoutubeId(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id && id.length === 11 ? id : null;
    }
    const v = u.searchParams.get('v');
    if (v && v.length === 11) return v;
    const embed = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    return embed?.[1] ?? null;
  } catch {
    return null;
  }
}

export function slugFromPageUrl(url: string): string {
  const segment = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
  if (!SLUG_REGEX.test(segment)) {
    throw new Error(`Invalid slug from URL: ${url} → "${segment}"`);
  }
  return segment;
}

export function slugifyArtist(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  if (!base || !SLUG_REGEX.test(base)) {
    throw new Error(`Cannot slugify artist: "${name}"`);
  }
  return base;
}

export function mapLanguage(idioma: string): 'en' | 'es' | 'hu' {
  const n = idioma.toLowerCase();
  if (n.includes('spanish') || n === 'español') return 'es';
  if (n.includes('hungarian') && !n.includes('english')) return 'hu';
  return 'en';
}

const FUENTE_MAP: Record<string, string> = {
  "baha'u'llah": 'bahaullah',
  "baha'u'lláh": 'bahaullah',
  "abdu'l-baha": 'abdulbaha',
  "abdu'l-bahá": 'abdulbaha',
  'the bab': 'bab',
  'shoghi effendi': 'texto-sagrado',
  "baha'i-inspired": 'reflexiva',
};

const ESTILO_MAP: Record<string, string> = {
  acoustic: 'tranquila',
  blues: 'reflexiva',
  'hip hop': 'muy-ritmica',
};

const CATEGORIA_MAP: Record<string, string> = {
  'studio session': 'bahaiblog-studio',
  'recording artist': 'bahaiblog-recording',
  community: 'bahaiblog-community',
  'hip hop session': 'bahaiblog-hip-hop',
};

export function mapFuenteCategories(fuente: string | null): string[] {
  if (!fuente) return [];
  const parts = fuente.split(/,\s*/);
  const out: string[] = [];
  for (const part of parts) {
    const key = part.trim().toLowerCase();
    const slug = FUENTE_MAP[key];
    if (slug) out.push(slug);
  }
  return out;
}

export function mapCategories(entry: BahaiblogRawEntry): string[] {
  const cats = new Set<string>(['cancion', 'con-audio']);
  for (const s of mapFuenteCategories(entry.fuente)) cats.add(s);
  const estilo = ESTILO_MAP[entry.estilo.toLowerCase()];
  if (estilo) cats.add(estilo);
  const cat = CATEGORIA_MAP[entry.categoria.toLowerCase()];
  if (cat) cats.add(cat);
  return [...cats].sort();
}

/** Strip decorative quotes and trailing "by Artist" from titles. */
export function normalizeTitle(titulo: string, artista: string): string {
  let t = titulo.trim().replace(/^["'""]+|["'""]+$/g, '').trim();

  const bySuffix = new RegExp(`\\s+by\\s+${escapeRegex(artista)}\\s*$`, 'i');
  t = t.replace(bySuffix, '').trim();
  t = t.replace(/["'""]+$/g, '').trim();

  const parts = t
    .split(/\s*[–—-]\s*/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/hip hop sessions/i.test(p));

  if (parts.length >= 2) {
    const [first, second] = parts;
    const artistLower = artista.toLowerCase();
    if (first && second && artistLower.includes(first.toLowerCase().slice(0, Math.min(8, first.length)))) {
      t = second.replace(/\s*\(ft\.\s*.+\)\s*$/i, '').trim();
    } else if (first && second && artistLower.includes(second.toLowerCase().slice(0, Math.min(8, second.length)))) {
      t = first.trim();
    } else if (first && second && first.length <= second.length) {
      t = first.trim();
    }
  }

  return t.replace(/^["'""]+|["'""]+$/g, '').trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildLyricsPlain(
  entry: BahaiblogRawEntry,
  sourcePageUrl: string,
): string | null {
  if (!entry.letra && !entry.acordes) return null;
  const credit = `Fuente: Baha'i Blog — ${sourcePageUrl}`;
  const parts: string[] = [credit];
  if (entry.letra?.trim()) parts.push(entry.letra.trim());
  if (entry.acordes?.trim()) parts.push(entry.acordes.trim());
  return parts.join('\n\n');
}

export function normalizeEntry(entry: BahaiblogRawEntry): BahaiblogNormalizedTrack | null {
  const youtubeId = parseYoutubeId(entry.youtube_url);
  if (!youtubeId) return null;

  const slug = slugFromPageUrl(entry.url_pagina);
  const artistName = entry.artista.trim();
  const title = normalizeTitle(entry.titulo, artistName);
  const lyricsPlain = buildLyricsPlain(entry, entry.url_pagina);

  return {
    slug,
    title,
    artistName,
    artistSlug: slugifyArtist(artistName),
    youtubeId,
    language: mapLanguage(entry.idioma),
    categorySlugs: mapCategories(entry),
    lyricsPlain,
    hasChords: Boolean(entry.acordes?.trim()),
    sourcePageUrl: entry.url_pagina,
  };
}

export function normalizeBatch(entries: readonly BahaiblogRawEntry[]): {
  tracks: BahaiblogNormalizedTrack[];
  skipped: { titulo: string; reason: string }[];
} {
  const tracks: BahaiblogNormalizedTrack[] = [];
  const skipped: { titulo: string; reason: string }[] = [];
  for (const entry of entries) {
    const n = normalizeEntry(entry);
    if (!n) {
      skipped.push({ titulo: entry.titulo, reason: 'missing or invalid youtube_url' });
      continue;
    }
    tracks.push(n);
  }
  return { tracks, skipped };
}
