import { Stack, Typography, Box } from '@mui/material';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/shared/lib/i18n/config';
import { knownCategorySlugs } from '@/features/catalog/lib/category-labels';
import { getActiveCategorySlugs } from '@/server/data/catalog';
import { GradientText } from '@/shared/ui/GradientText';
import { accent, cssVars } from '@/shared/theme/tokens';
import { SuggestForm } from '@/features/suggestions/components/SuggestForm';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'suggest' });
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}

export default async function SuggestPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('suggest');

  const activeSlugs = await getActiveCategorySlugs();
  const known = new Set(knownCategorySlugs());
  const categorySlugs = activeSlugs.filter((slug) => known.has(slug));

  return (
    <Stack spacing={4} sx={{ maxWidth: 880, mx: 'auto', py: { xs: 2, md: 4 } }}>
      <Box>
        <Typography
          sx={{
            color: accent.cyan,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          BahaiSongs
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, mb: 1 }}>
          <GradientText variant="aurora">{t('pageTitle')}</GradientText>
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, maxWidth: 640, lineHeight: 1.55 }}>
          {t('pageDescription')}
        </Typography>
      </Box>

      <SuggestForm locale={locale as Locale} categorySlugs={categorySlugs} />
    </Stack>
  );
}
