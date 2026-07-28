import type { Locale } from '@/shared/lib/i18n/config';
import { defaultLocale } from '@/shared/lib/i18n/config';
import { accent } from '@/shared/theme/tokens';

type LocalizedLabel = Record<Locale, string>;

interface CategoryDescriptor {
  labels: LocalizedLabel;
  kind: 'genre' | 'mood' | 'theme' | 'tag';
}

function L(
  es: string,
  en: string,
  fr: string,
  de: string,
  pt: string,
  ru: string,
  ar: string,
  fa: string,
): LocalizedLabel {
  return { es, en, fr, de, pt, ru, ar, fa };
}

/**
 * Display labels for the category slugs used in the catalogue. Mirrors the
 * seed in `supabase/seed.sql`. New slugs that appear in the import without a
 * mapping here fall back to a titlecased version of the slug.
 */
const CATEGORY_LABELS: Record<string, CategoryDescriptor> = {
  cancion: {
    labels: L('Canciones', 'Songs', 'Chansons', 'Lieder', 'Canções', 'Песни', 'أناشيد', 'سرودها'),
    kind: 'genre',
  },
  oracion: {
    labels: L('Oraciones', 'Prayers', 'Prières', 'Gebete', 'Orações', 'Молитвы', 'صلوات', 'دعاها'),
    kind: 'theme',
  },
  'texto-sagrado': {
    labels: L(
      'Texto sagrado',
      'Sacred text',
      'Texte sacré',
      'Heiliger Text',
      'Texto sagrado',
      'Священный текст',
      'نص مقدس',
      'متن مقدس',
    ),
    kind: 'theme',
  },
  'palabra-oculta': {
    labels: L(
      'Palabras ocultas',
      'Hidden Words',
      'Paroles cachées',
      'Verborgenen Worte',
      'Palavras ocultas',
      'Сокровенные слова',
      'الكلمات المكنونة',
      'کلمات مکنونه',
    ),
    kind: 'theme',
  },
  bab: {
    labels: L('El Báb', 'The Báb', 'Le Báb', 'Der Báb', 'O Báb', 'Баб', 'الباب', 'باب'),
    kind: 'theme',
  },
  bahaullah: {
    labels: L(
      "Bahá'u'lláh",
      "Bahá'u'lláh",
      "Bahá'u'lláh",
      "Bahá'u'lláh",
      "Bahá'u'lláh",
      "Бахаулла",
      "بهاءالله",
      "بهاءالله",
    ),
    kind: 'theme',
  },
  abdulbaha: {
    labels: L(
      "'Abdu'l-Bahá",
      "'Abdu'l-Bahá",
      "'Abdu'l-Bahá",
      "'Abdu'l-Bahá",
      "'Abdu'l-Bahá",
      "Абдул-Баха",
      "عبدالبهاء",
      "عبدالبهاء",
    ),
    kind: 'theme',
  },
  tranquila: {
    labels: L('Tranquila', 'Calm', 'Calme', 'Ruhig', 'Calma', 'Спокойная', 'هادئة', 'آرام'),
    kind: 'mood',
  },
  ritmica: {
    labels: L('Rítmica', 'Rhythmic', 'Rythmique', 'Rhythmisch', 'Rítmica', 'Ритмичная', 'إيقاعية', 'ریتمیک'),
    kind: 'mood',
  },
  'muy-ritmica': {
    labels: L(
      'Muy rítmica',
      'Very rhythmic',
      'Très rythmique',
      'Sehr rhythmisch',
      'Muito rítmica',
      'Очень ритмичная',
      'إيقاعية جدًا',
      'بسیار ریتمیک',
    ),
    kind: 'mood',
  },
  reflexiva: {
    labels: L(
      'Reflexiva',
      'Reflective',
      'Réfléchie',
      'Nachdenklich',
      'Reflexiva',
      'Созерцательная',
      'تأملية',
      'تأملی',
    ),
    kind: 'mood',
  },
  infantil: {
    labels: L('Infantil', 'Children', 'Enfants', 'Kinder', 'Infantil', 'Детская', 'أطفال', 'کودکان'),
    kind: 'theme',
  },
  jovenes: {
    labels: L('Jóvenes', 'Youth', 'Jeunes', 'Jugend', 'Jovens', 'Молодёжь', 'شباب', 'جوانان'),
    kind: 'theme',
  },
  feliz: {
    labels: L('Alegre', 'Joyful', 'Joyeuse', 'Fröhlich', 'Alegre', 'Радостная', 'مبهجة', 'شاد'),
    kind: 'mood',
  },
  'con-acordes': {
    labels: L(
      'Con acordes',
      'With chords',
      'Avec accords',
      'Mit Akkorden',
      'Com acordes',
      'С аккордами',
      'مع أوتار',
      'با آکورد',
    ),
    kind: 'tag',
  },
  'con-audio': {
    labels: L(
      'Con audio',
      'With audio',
      'Avec audio',
      'Mit Audio',
      'Com áudio',
      'С аудио',
      'مع صوت',
      'با صدا',
    ),
    kind: 'tag',
  },
  'bicentenario-bab': {
    labels: L(
      'Bicentenario del Báb',
      'Báb bicentenary',
      'Bicentenaire du Báb',
      'Zweihundertjahrfeier des Báb',
      'Bicentenário do Báb',
      'Двухсотлетие Баба',
      'مئوية الباب المئوية الثانية',
      'دویستمین سالگرد باب',
    ),
    kind: 'theme',
  },
  'bahaiblog-studio': {
    labels: L(
      "Baha'i Blog studio",
      "Baha'i Blog studio",
      "Studio Baha'i Blog",
      "Baha'i Blog Studio",
      "Estúdio Baha'i Blog",
      "Студия Baha'i Blog",
      "استوديو Baha'i Blog",
      "استودیوی Baha'i Blog",
    ),
    kind: 'tag',
  },
  'bahaiblog-recording': {
    labels: L(
      "Baha'i Blog recording artist",
      "Baha'i Blog recording artist",
      "Artiste enregistré Baha'i Blog",
      "Baha'i Blog Recording Artist",
      "Artista gravado Baha'i Blog",
      "Исполнитель Baha'i Blog",
      "فنان تسجيل Baha'i Blog",
      "هنرمند ضبط Baha'i Blog",
    ),
    kind: 'tag',
  },
  'bahaiblog-community': {
    labels: L(
      "Baha'i Blog community",
      "Baha'i Blog community",
      "Communauté Baha'i Blog",
      "Baha'i Blog Community",
      "Comunidade Baha'i Blog",
      "Сообщество Baha'i Blog",
      "مجتمع Baha'i Blog",
      "جامعهٔ Baha'i Blog",
    ),
    kind: 'tag',
  },
  'bahaiblog-hip-hop': {
    labels: L(
      "Baha'i Blog hip hop",
      "Baha'i Blog hip hop",
      "Hip-hop Baha'i Blog",
      "Baha'i Blog Hip-Hop",
      "Hip hop Baha'i Blog",
      "Хип-хоп Baha'i Blog",
      "هيب هوب Baha'i Blog",
      "هیپ‌هاپ Baha'i Blog",
    ),
    kind: 'tag',
  },
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
  return entry.labels[locale] ?? entry.labels[defaultLocale];
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
