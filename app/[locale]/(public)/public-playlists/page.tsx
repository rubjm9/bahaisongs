import { Stack, Typography, Box } from '@mui/material';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { GradientText } from '@/shared/ui/GradientText';
import { getPublicPlaylists } from '@/server/data/playlists';
import { PublicPlaylistsPageClient } from '@/features/public-playlists/components/PublicPlaylistsPageClient';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { SITE_URL } from '@/shared/lib/seo/site';
import { accent, cssVars } from '@/shared/theme/tokens';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const isEs = locale !== 'en';
  const canonical = `${SITE_URL}${appPath(locale as Locale, 'public-playlists')}`;
  return {
    title: isEs
      ? 'Playlists públicas – Canciones bahá\'ís | BahaiSongs'
      : 'Public playlists – Bahá\'í songs | BahaiSongs',
    description: isEs
      ? 'Explora playlists públicas creadas por la comunidad y por BahaiSongs: colecciones de canciones bahá\'ís para cantar y tocar juntos.'
      : 'Browse public playlists created by the community and BahaiSongs: collections of Bahá\'í songs to sing and play together.',
    alternates: {
      canonical,
      languages: {
        es: `${SITE_URL}${appPath('es', 'public-playlists')}`,
        en: `${SITE_URL}${appPath('en', 'public-playlists')}`,
      },
    },
  };
}

export default async function PublicPlaylistsPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('publicPlaylists');
  const playlists = await getPublicPlaylists();

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

      <PublicPlaylistsPageClient playlists={playlists} />
    </Stack>
  );
}
