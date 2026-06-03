'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Heart, ListMusic } from 'lucide-react';
import { cssVars, radii, accent } from '@/shared/theme/tokens';
import { FavoritesPage } from '@/features/favorites/components/FavoritesPage';
import { UserPlaylistsList } from '@/features/playlists/components/UserPlaylistsList';
import { useUser } from '@/features/auth/hooks/useUser';
import { LoginModal } from '@/features/auth/components/LoginModal';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';

interface TrackSummary {
  slug: string;
  title: string;
  artist: string;
}

interface Props {
  allTracks: TrackSummary[];
}

export function LibraryHubClient({ allTracks }: Props) {
  const t = useTranslations('library');
  const tAuth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const { user, loading: userLoading } = useUser();
  const [loginOpen, setLoginOpen] = useState(false);

  if (userLoading) {
    return (
      <Typography sx={{ color: cssVars.textMuted, fontSize: '0.9rem' }}>
        {t('loading')}
      </Typography>
    );
  }

  if (!user) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          py: 6,
          textAlign: 'center',
          maxWidth: 420,
          mx: 'auto',
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: cssVars.textPrimary }}>
          {t('signInTitle')}
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: cssVars.textMuted }}>
          {t('signInHint')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setLoginOpen(true)}
          sx={{
            mt: 1,
            borderRadius: `${radii.pill}px`,
            textTransform: 'none',
            fontWeight: 600,
            background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`,
          }}
        >
          {tAuth('signIn')}
        </Button>
        <Link href={appPath(locale, 'discover')} style={{ textDecoration: 'none' }}>
          <Typography sx={{ fontSize: '0.85rem', color: accent.cyan, mt: 1 }}>
            {t('exploreCatalog')}
          </Typography>
        </Link>
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <Box component="section" aria-labelledby="library-favorites-heading">
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          id="library-favorites-heading"
          sx={{ mb: 2 }}
        >
          <Heart size={18} style={{ color: accent.cyan }} aria-hidden />
          <Typography variant="h6" sx={{ fontWeight: 600, color: cssVars.textPrimary }}>
            {tAuth('favorites')}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Link href={appPath(locale, 'favorites')} style={{ textDecoration: 'none' }}>
            <Typography sx={{ fontSize: '0.8rem', color: cssVars.textMuted, '&:hover': { color: accent.cyan } }}>
              {t('viewAll')}
            </Typography>
          </Link>
        </Stack>
        <FavoritesPage allTracks={allTracks} />
      </Box>

      <Box component="section" aria-labelledby="library-playlists-heading">
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          id="library-playlists-heading"
          sx={{ mb: 2 }}
        >
          <ListMusic size={18} style={{ color: accent.cyan }} aria-hidden />
          <Typography variant="h6" sx={{ fontWeight: 600, color: cssVars.textPrimary }}>
            {tAuth('myPlaylists')}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Link href={appPath(locale, 'playlists')} style={{ textDecoration: 'none' }}>
            <Typography sx={{ fontSize: '0.8rem', color: cssVars.textMuted, '&:hover': { color: accent.cyan } }}>
              {t('viewAll')}
            </Typography>
          </Link>
        </Stack>
        <UserPlaylistsList />
      </Box>
    </Stack>
  );
}
