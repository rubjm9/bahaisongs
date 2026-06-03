import { Stack, Typography, Box } from '@mui/material';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { GradientText } from '@/shared/ui/GradientText';
import { getAllTracks } from '@/server/data/catalog';
import { accent, cssVars } from '@/shared/theme/tokens';
import { LibraryHubClient } from '@/features/library/components/LibraryHubClient';

type Params = Promise<{ locale: string }>;

export default async function LibraryPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('library');

  const allTracks = (await getAllTracks()).map((tr) => ({
    slug: tr.slug,
    title: tr.title,
    artist: tr.artist,
  }));

  return (
    <Stack spacing={5} sx={{ maxWidth: 980, mx: 'auto' }}>
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
          {t('eyebrow')}
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700 }}>
          <GradientText variant="aurora">{t('title')}</GradientText>
        </Typography>
        <Typography sx={{ color: cssVars.textMuted, mt: 1, fontSize: '0.95rem' }}>
          {t('subtitle')}
        </Typography>
      </Box>

      <LibraryHubClient allTracks={allTracks} />
    </Stack>
  );
}
