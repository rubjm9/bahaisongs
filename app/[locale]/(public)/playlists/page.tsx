import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Stack, Typography, Box } from '@mui/material';
import { GradientText } from '@/shared/ui/GradientText';
import { accent } from '@/shared/theme/tokens';
import { PlaylistsClientPage } from '@/features/playlists/components/PlaylistsClientPage';

type Params = Promise<{ locale: string }>;

export default async function PlaylistsPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

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
          {t('myPlaylists')}
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700 }}>
          <GradientText variant="aurora">{t('myPlaylists')}</GradientText>
        </Typography>
      </Box>
      <PlaylistsClientPage />
    </Stack>
  );
}
