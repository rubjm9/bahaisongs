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
import { cssVars } from '@/shared/theme/tokens';

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const active = new Set(await getActiveCategorySlugs());
  return knownCategorySlugs()
    .filter((s) => active.has(s))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, locale } = await params;
  const label = categoryLabel(slug, locale as Locale);
  return {
    title: label,
    description: `${label} · BahaiSongs`,
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

  return (
    <Stack spacing={5} sx={{ maxWidth: 1100, mx: 'auto' }}>
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
