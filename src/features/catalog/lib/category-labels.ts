import type { Locale } from '@/shared/lib/i18n/config';
import { accent } from '@/shared/theme/tokens';

interface CategoryDescriptor {
  es: string;
  en: string;
  kind: 'genre' | 'mood' | 'theme' | 'tag';
}

/**
 * Display labels for the category slugs used in the catalogue. Mirrors the
 * seed in `supabase/seed.sql`. New slugs that appear in the import without a
 * mapping here fall back to a titlecased version of the slug.
 */
const CATEGORY_LABELS: Record<string, CategoryDescriptor> = {
  cancion: { es: 'Canciones', en: 'Songs', kind: 'genre' },
  oracion: { es: 'Oraciones', en: 'Prayers', kind: 'theme' },
  'texto-sagrado': { es: 'Texto Sagrado', en: 'Sacred Text', kind: 'theme' },
  'palabra-oculta': { es: 'Palabras Ocultas', en: 'Hidden Words', kind: 'theme' },
  bab: { es: 'El Báb', en: 'The Báb', kind: 'theme' },
  bahaullah: { es: "Bahá'u'lláh", en: "Bahá'u'lláh", kind: 'theme' },
  abdulbaha: { es: "'Abdu'l-Bahá", en: "'Abdu'l-Bahá", kind: 'theme' },
  tranquila: { es: 'Tranquila', en: 'Calm', kind: 'mood' },
  ritmica: { es: 'Rítmica', en: 'Rhythmic', kind: 'mood' },
  'muy-ritmica': { es: 'Muy rítmica', en: 'Very rhythmic', kind: 'mood' },
  reflexiva: { es: 'Reflexiva', en: 'Reflective', kind: 'mood' },
  infantil: { es: 'Infantil', en: 'Children', kind: 'theme' },
  jovenes: { es: 'Jóvenes', en: 'Youth', kind: 'theme' },
  feliz: { es: 'Alegre', en: 'Joyful', kind: 'mood' },
  'con-acordes': { es: 'Con acordes', en: 'With chords', kind: 'tag' },
  'con-audio': { es: 'Con audio', en: 'With audio', kind: 'tag' },
  'bicentenario-bab': { es: 'Bicentenario del Báb', en: 'Báb bicentenary', kind: 'theme' },
};

function fallback(slug: string): string {
  return slug
    .split('-')
    .map((word) => (word.length === 0 ? word : word[0]?.toUpperCase() + word.slice(1)))
    .join(' ');
}

export function categoryLabel(slug: string, locale: Locale): string {
  const entry = CATEGORY_LABELS[slug];
  if (!entry) return fallback(slug);
  return locale === 'en' ? entry.en : entry.es;
}

export function categoryKind(slug: string): 'genre' | 'mood' | 'theme' | 'tag' {
  return CATEGORY_LABELS[slug]?.kind ?? 'tag';
}

export function categoryKindColor(slug: string): string {
  const kind = categoryKind(slug);
  const map: Record<string, string> = {
    mood: accent.indigo,
    genre: accent.electric,
    theme: accent.glow,
    tag: accent.cyan,
  };
  return map[kind] ?? accent.cyan;
}

export function knownCategorySlugs(): string[] {
  return Object.keys(CATEGORY_LABELS);
}
