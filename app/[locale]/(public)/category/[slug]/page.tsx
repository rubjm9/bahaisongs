import { notFound } from 'next/navigation';
import { Stack, Typography, Box } from '@mui/material';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { GradientText } from '@/shared/ui/GradientText';
import { TrackList } from '@/features/catalog/components/TrackList';
import {
  categoryLabel,
  categoryKind,
  categoryKindColor,
  knownCategorySlugs,
} from '@/features/catalog/lib/category-labels';
import { getActiveCategorySlugs, getTracksByCategory } from '@/server/data/catalog';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { SITE_URL } from '@/shared/lib/seo/site';
import { BreadcrumbJsonLd } from '@/shared/lib/seo/JsonLd';
import { cssVars } from '@/shared/theme/tokens';

const CATEGORY_DESCRIPTIONS: Record<string, { es: string; en: string }> = {
  oracion: {
    es: "Aprende a cantar las oraciones bahá'ís. Letra completa y acordes de guitarra para oraciones de Bahá'u'lláh y 'Abdu'l-Bahá en español.",
    en: "Learn to sing Bahá'í prayers. Full lyrics and guitar chords for prayers by Bahá'u'lláh and 'Abdu'l-Bahá.",
  },
  'con-acordes': {
    es: "Todas las canciones bahá'ís con acordes de guitarra. Letras completas y transposición automática. Aprende a tocarlas paso a paso.",
    en: "All Bahá'í songs with guitar chords. Full lyrics and automatic transposition. Learn to play them step by step.",
  },
  tranquila: {
    es: "Canciones bahá'ís tranquilas para reflexionar, meditar o descansar. Letra y acordes en español.",
    en: "Calm Bahá'í songs for reflection, meditation or rest. Lyrics and chords.",
  },
  'muy-ritmica': {
    es: "Canciones bahá'ís rítmicas y animadas para cantar juntos. Letra y acordes para guitarra.",
    en: "Rhythmic and upbeat Bahá'í songs to sing together. Lyrics and guitar chords.",
  },
  'texto-sagrado': {
    es: "Canciones bahá'ís basadas en textos sagrados de Bahá'u'lláh, el Báb y 'Abdu'l-Bahá. Letra y acordes en español.",
    en: "Bahá'í songs based on sacred texts by Bahá'u'lláh, the Báb and 'Abdu'l-Bahá. Lyrics and chords.",
  },
};

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const active = new Set(await getActiveCategorySlugs());
  return knownCategorySlugs()
    .filter((s) => active.has(s))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params;
  const loc = locale as Locale;
  const label = categoryLabel(slug, loc);
  const isEs = locale !== 'en';
  const canonical = `${SITE_URL}${appPath(loc, `category/${slug}`)}`;

  const descTemplates = CATEGORY_DESCRIPTIONS[slug];
  const description =
    descTemplates?.[isEs ? 'es' : 'en'] ??
    (isEs
      ? `${label} — canciones bahá'ís con letra y acordes | BahaiSongs`
      : `${label} — Bahá'í songs with lyrics and chords | BahaiSongs`);

  return {
    title: isEs
      ? `${label} – Canciones bahá'ís | BahaiSongs`
      : `${label} – Bahá'í Songs | BahaiSongs`,
    description,
    alternates: {
      canonical,
      languages: {
        es: `${SITE_URL}${appPath('es', `category/${slug}`)}`,
        en: `${SITE_URL}${appPath('en', `category/${slug}`)}`,
      },
    },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tracks = await getTracksByCategory(slug);
  if (tracks.length === 0) notFound();

  const t = await getTranslations('category');
  const loc = locale as Locale;
  const label = categoryLabel(slug, loc);
  const kind = categoryKind(slug);
  const kindColor = categoryKindColor(slug);
  const categoryUrl = `${SITE_URL}${appPath(loc, `category/${slug}`)}`;

  return (
    <Stack spacing={5} sx={{ maxWidth: 1100, mx: 'auto' }}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: SITE_URL },
          { name: 'Catálogo', url: `${SITE_URL}/library` },
          { name: label, url: categoryUrl },
        ]}
      />
      <Box>
        <Typography
          sx={{
            color: kindColor,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          {t(`kind.${kind}`)}
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: '2rem', md: '2.75rem' }, fontWeight: 700 }}>
          <GradientText variant="aurora">{label}</GradientText>
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, mt: 1, fontSize: '0.95rem' }}>
          {t('trackCount', { count: tracks.length })}
        </Typography>
      </Box>

      <TrackList tracks={tracks} locale={loc} numbered />
    </Stack>
  );
}
