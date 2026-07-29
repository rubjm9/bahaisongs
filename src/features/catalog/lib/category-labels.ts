import type { Locale } from '@/shared/lib/i18n/config';
import { defaultLocale, locales } from '@/shared/lib/i18n/config';
import { accent } from '@/shared/theme/tokens';

type LocalizedLabel = Record<Locale, string>;

interface CategoryDescriptor {
  labels: LocalizedLabel;
  kind: 'genre' | 'mood' | 'theme' | 'tag';
}

/** Build a full locale map; missing keys fall back to en, then es. */
function L(partial: Partial<Record<Locale, string>> & { es: string; en: string }): LocalizedLabel {
  const result = {} as LocalizedLabel;
  for (const locale of locales) {
    result[locale] = partial[locale] ?? partial.en ?? partial.es;
  }
  return result;
}

/**
 * Display labels for the category slugs used in the catalogue. Mirrors the
 * seed in `supabase/seed.sql`. New slugs that appear in the import without a
 * mapping here fall back to a titlecased version of the slug.
 */
const CATEGORY_LABELS: Record<string, CategoryDescriptor> = {
  cancion: {
    labels: L({
      es: 'Canciones',
      en: 'Songs',
      fr: 'Chansons',
      de: 'Lieder',
      it: 'Canzoni',
      pt: 'Canções',
      hu: 'Dalok',
      ru: 'Песни',
      zh: '歌曲',
      hi: 'गीत',
      sw: 'Nyimbo',
      ar: 'أناشيد',
      fa: 'سرودها',
    }),
    kind: 'genre',
  },
  oracion: {
    labels: L({
      es: 'Oraciones',
      en: 'Prayers',
      fr: 'Prières',
      de: 'Gebete',
      it: 'Preghiere',
      pt: 'Orações',
      hu: 'Imák',
      ru: 'Молитвы',
      zh: '祈祷',
      hi: 'प्रार्थनाएँ',
      sw: 'Sala',
      ar: 'صلوات',
      fa: 'دعاها',
    }),
    kind: 'theme',
  },
  'texto-sagrado': {
    labels: L({
      es: 'Texto sagrado',
      en: 'Sacred text',
      fr: 'Texte sacré',
      de: 'Heiliger Text',
      it: 'Testo sacro',
      pt: 'Texto sagrado',
      hu: 'Szent szöveg',
      ru: 'Священный текст',
      zh: '圣文',
      hi: 'पवित्र पाठ',
      sw: 'Maandiko matakatifu',
      ar: 'نص مقدس',
      fa: 'متن مقدس',
    }),
    kind: 'theme',
  },
  'palabra-oculta': {
    labels: L({
      es: 'Palabras ocultas',
      en: 'Hidden Words',
      fr: 'Paroles cachées',
      de: 'Verborgenen Worte',
      it: 'Parole nascoste',
      pt: 'Palavras ocultas',
      hu: 'Rejtett szavak',
      ru: 'Сокровенные слова',
      zh: '隐言经',
      hi: 'गुप्त वचन',
      sw: 'Maneno yaliyofichwa',
      ar: 'الكلمات المكنونة',
      fa: 'کلمات مکنونه',
    }),
    kind: 'theme',
  },
  bab: {
    labels: L({
      es: 'El Báb',
      en: 'The Báb',
      fr: 'Le Báb',
      de: 'Der Báb',
      it: 'Il Báb',
      pt: 'O Báb',
      hu: 'A Báb',
      ru: 'Баб',
      zh: '巴孛',
      hi: 'बाब',
      sw: 'Báb',
      ar: 'الباب',
      fa: 'باب',
    }),
    kind: 'theme',
  },
  bahaullah: {
    labels: L({
      es: "Bahá'u'lláh",
      en: "Bahá'u'lláh",
      fr: "Bahá'u'lláh",
      de: "Bahá'u'lláh",
      it: "Bahá'u'lláh",
      pt: "Bahá'u'lláh",
      hu: "Bahá'u'lláh",
      ru: 'Бахаулла',
      zh: '巴哈欧拉',
      hi: "बहाउल्लाह",
      sw: "Bahá'u'lláh",
      ar: 'بهاءالله',
      fa: 'بهاءالله',
    }),
    kind: 'theme',
  },
  abdulbaha: {
    labels: L({
      es: "'Abdu'l-Bahá",
      en: "'Abdu'l-Bahá",
      fr: "'Abdu'l-Bahá",
      de: "'Abdu'l-Bahá",
      it: "'Abdu'l-Bahá",
      pt: "'Abdu'l-Bahá",
      hu: "'Abdu'l-Bahá",
      ru: 'Абдул-Баха',
      zh: '阿博都-巴哈',
      hi: "अब्दुल-बहा",
      sw: "'Abdu'l-Bahá",
      ar: 'عبدالبهاء',
      fa: 'عبدالبهاء',
    }),
    kind: 'theme',
  },
  tranquila: {
    labels: L({
      es: 'Tranquila',
      en: 'Calm',
      fr: 'Calme',
      de: 'Ruhig',
      it: 'Calma',
      pt: 'Calma',
      hu: 'Nyugodt',
      ru: 'Спокойная',
      zh: '平静',
      hi: 'शांत',
      sw: 'Tulivu',
      ar: 'هادئة',
      fa: 'آرام',
    }),
    kind: 'mood',
  },
  ritmica: {
    labels: L({
      es: 'Rítmica',
      en: 'Rhythmic',
      fr: 'Rythmique',
      de: 'Rhythmisch',
      it: 'Ritmica',
      pt: 'Rítmica',
      hu: 'Ritmikus',
      ru: 'Ритмичная',
      zh: '有节奏',
      hi: 'लयबद्ध',
      sw: 'Yenye midundo',
      ar: 'إيقاعية',
      fa: 'ریتمیک',
    }),
    kind: 'mood',
  },
  'muy-ritmica': {
    labels: L({
      es: 'Muy rítmica',
      en: 'Very rhythmic',
      fr: 'Très rythmique',
      de: 'Sehr rhythmisch',
      it: 'Molto ritmica',
      pt: 'Muito rítmica',
      hu: 'Nagyon ritmikus',
      ru: 'Очень ритмичная',
      zh: '节奏感强',
      hi: 'बहुत लयबद्ध',
      sw: 'Yenye midundo mingi',
      ar: 'إيقاعية جدًا',
      fa: 'بسیار ریتمیک',
    }),
    kind: 'mood',
  },
  reflexiva: {
    labels: L({
      es: 'Reflexiva',
      en: 'Reflective',
      fr: 'Réfléchie',
      de: 'Nachdenklich',
      it: 'Riflessiva',
      pt: 'Reflexiva',
      hu: 'Elmélkedő',
      ru: 'Созерцательная',
      zh: '沉思',
      hi: 'चिंतनशील',
      sw: 'Ya kutafakari',
      ar: 'تأملية',
      fa: 'تأملی',
    }),
    kind: 'mood',
  },
  infantil: {
    labels: L({
      es: 'Infantil',
      en: 'Children',
      fr: 'Enfants',
      de: 'Kinder',
      it: 'Bambini',
      pt: 'Infantil',
      hu: 'Gyerekek',
      ru: 'Детская',
      zh: '儿童',
      hi: 'बच्चे',
      sw: 'Watoto',
      ar: 'أطفال',
      fa: 'کودکان',
    }),
    kind: 'theme',
  },
  jovenes: {
    labels: L({
      es: 'Jóvenes',
      en: 'Youth',
      fr: 'Jeunes',
      de: 'Jugend',
      it: 'Giovani',
      pt: 'Jovens',
      hu: 'Fiatalok',
      ru: 'Молодёжь',
      zh: '青年',
      hi: 'युवा',
      sw: 'Vijana',
      ar: 'شباب',
      fa: 'جوانان',
    }),
    kind: 'theme',
  },
  feliz: {
    labels: L({
      es: 'Alegre',
      en: 'Joyful',
      fr: 'Joyeuse',
      de: 'Fröhlich',
      it: 'Gioiosa',
      pt: 'Alegre',
      hu: 'Örömteli',
      ru: 'Радостная',
      zh: '欢乐',
      hi: 'आनंदमय',
      sw: 'Yenye furaha',
      ar: 'مبهجة',
      fa: 'شاد',
    }),
    kind: 'mood',
  },
  'con-acordes': {
    labels: L({
      es: 'Con acordes',
      en: 'With chords',
      fr: 'Avec accords',
      de: 'Mit Akkorden',
      it: 'Con accordi',
      pt: 'Com acordes',
      hu: 'Akkordokkal',
      ru: 'С аккордами',
      zh: '带和弦',
      hi: 'कॉर्ड के साथ',
      sw: 'Na kodi',
      ar: 'مع أوتار',
      fa: 'با آکورد',
    }),
    kind: 'tag',
  },
  'con-audio': {
    labels: L({
      es: 'Con audio',
      en: 'With audio',
      fr: 'Avec audio',
      de: 'Mit Audio',
      it: 'Con audio',
      pt: 'Com áudio',
      hu: 'Hanggal',
      ru: 'С аудио',
      zh: '有音频',
      hi: 'ऑडियो के साथ',
      sw: 'Na sauti',
      ar: 'مع صوت',
      fa: 'با صدا',
    }),
    kind: 'tag',
  },
  'bicentenario-bab': {
    labels: L({
      es: 'Bicentenario del Báb',
      en: 'Báb bicentenary',
      fr: 'Bicentenaire du Báb',
      de: 'Zweihundertjahrfeier des Báb',
      it: 'Bicentenario del Báb',
      pt: 'Bicentenário do Báb',
      hu: 'A Báb kétszázadik évfordulója',
      ru: 'Двухсотлетие Баба',
      zh: '巴孛二百周年',
      hi: 'बाब द्विशताब्दी',
      sw: 'Miaka mia mbili ya Báb',
      ar: 'مئوية الباب المئوية الثانية',
      fa: 'دویستمین سالگرد باب',
    }),
    kind: 'theme',
  },
  'bahaiblog-studio': {
    labels: L({
      es: "Baha'i Blog studio",
      en: "Baha'i Blog studio",
      fr: "Studio Baha'i Blog",
      de: "Baha'i Blog Studio",
      it: "Studio Baha'i Blog",
      pt: "Estúdio Baha'i Blog",
      hu: "Baha'i Blog stúdió",
      ru: "Студия Baha'i Blog",
      zh: "Baha'i Blog 工作室",
      hi: "Baha'i Blog स्टूडियो",
      sw: "Studio ya Baha'i Blog",
      ar: "استوديو Baha'i Blog",
      fa: "استودیوی Baha'i Blog",
    }),
    kind: 'tag',
  },
  'bahaiblog-recording': {
    labels: L({
      es: "Baha'i Blog recording artist",
      en: "Baha'i Blog recording artist",
      fr: "Artiste enregistré Baha'i Blog",
      de: "Baha'i Blog Recording Artist",
      it: "Artista registrato Baha'i Blog",
      pt: "Artista gravado Baha'i Blog",
      hu: "Baha'i Blog előadó",
      ru: "Исполнитель Baha'i Blog",
      zh: "Baha'i Blog 录音艺人",
      hi: "Baha'i Blog रिकॉर्डिंग कलाकार",
      sw: "Msanii wa kurekodi Baha'i Blog",
      ar: "فنان تسجيل Baha'i Blog",
      fa: "هنرمند ضبط Baha'i Blog",
    }),
    kind: 'tag',
  },
  'bahaiblog-community': {
    labels: L({
      es: "Baha'i Blog community",
      en: "Baha'i Blog community",
      fr: "Communauté Baha'i Blog",
      de: "Baha'i Blog Community",
      it: "Comunità Baha'i Blog",
      pt: "Comunidade Baha'i Blog",
      hu: "Baha'i Blog közösség",
      ru: "Сообщество Baha'i Blog",
      zh: "Baha'i Blog 社区",
      hi: "Baha'i Blog समुदाय",
      sw: "Jumuiya ya Baha'i Blog",
      ar: "مجتمع Baha'i Blog",
      fa: "جامعهٔ Baha'i Blog",
    }),
    kind: 'tag',
  },
  'bahaiblog-hip-hop': {
    labels: L({
      es: "Baha'i Blog hip hop",
      en: "Baha'i Blog hip hop",
      fr: "Hip-hop Baha'i Blog",
      de: "Baha'i Blog Hip-Hop",
      it: "Hip hop Baha'i Blog",
      pt: "Hip hop Baha'i Blog",
      hu: "Baha'i Blog hiphop",
      ru: "Хип-хоп Baha'i Blog",
      zh: "Baha'i Blog 嘻哈",
      hi: "Baha'i Blog हिप हॉप",
      sw: "Hip hop ya Baha'i Blog",
      ar: "هيب هوب Baha'i Blog",
      fa: "هیپ‌هاپ Baha'i Blog",
    }),
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
