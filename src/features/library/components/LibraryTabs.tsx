'use client';

import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { cssVars } from '@/shared/theme/tokens';
import { TrackList } from '@/features/catalog/components/TrackList';
import { FavoritesPage } from '@/features/favorites/components/FavoritesPage';
import { UserPlaylistsList } from '@/features/playlists/components/UserPlaylistsList';
import { useUser } from '@/features/auth/hooks/useUser';
import type { CatalogTrack } from '@/server/data/catalog';
import type { Locale } from '@/shared/lib/i18n/config';

interface Props {
  tracks: readonly CatalogTrack[];
  locale: Locale;
}

export function LibraryTabs({ tracks, locale }: Props) {
  const t = useTranslations('library');
  const tAuth = useTranslations('auth');
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v as number)}
        sx={{
          mb: 3,
          borderBottom: `1px solid ${cssVars.borderSubtle}`,
          '& .MuiTab-root': {
            color: cssVars.textMuted,
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none',
            minHeight: 44,
          },
          '& .Mui-selected': { color: cssVars.textPrimary },
          '& .MuiTabs-indicator': { background: cssVars.accentElectric },
        }}
      >
        <Tab label={t('allTracks')} />
        <Tab label={tAuth('favorites')} />
        <Tab label={tAuth('myPlaylists')} />
      </Tabs>

      {tab === 0 && <TrackList tracks={tracks} locale={locale} numbered />}
      {tab === 1 &&
        (userLoading ? (
          <Typography sx={{ color: cssVars.textMuted, fontSize: '0.9rem', py: 2 }}>
            {t('loading')}
          </Typography>
        ) : user ? (
          <FavoritesPage
            allTracks={tracks.map((tr) => ({
              slug: tr.slug,
              title: tr.title,
              artist: tr.artist,
            }))}
          />
        ) : (
          <Typography sx={{ color: cssVars.textMuted, fontSize: '0.9rem', py: 2 }}>
            {t('signInHint')}
          </Typography>
        ))}
      {tab === 2 &&
        (userLoading ? (
          <Typography sx={{ color: cssVars.textMuted, fontSize: '0.9rem', py: 2 }}>
            {t('loading')}
          </Typography>
        ) : user ? (
          <UserPlaylistsList />
        ) : (
          <Typography sx={{ color: cssVars.textMuted, fontSize: '0.9rem', py: 2 }}>
            {t('signInHint')}
          </Typography>
        ))}
    </Box>
  );
}
