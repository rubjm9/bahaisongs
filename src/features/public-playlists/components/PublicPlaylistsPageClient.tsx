'use client';

import { useTranslations } from 'next-intl';
import { Box, Typography } from '@mui/material';
import { ListMusic } from 'lucide-react';
import type { PublicPlaylistSummary } from '@/server/data/playlists';
import { cssVars, radii } from '@/shared/theme/tokens';
import { PublicPlaylistCard } from './PublicPlaylistCard';

interface Props {
  playlists: PublicPlaylistSummary[];
}

export function PublicPlaylistsPageClient({ playlists }: Props) {
  const t = useTranslations('publicPlaylists');

  if (playlists.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 3,
          borderRadius: `${radii.lg}px`,
          background: cssVars.bgGlass,
          border: `1px solid ${cssVars.borderSubtle}`,
          textAlign: 'center',
        }}
      >
        <ListMusic size={32} style={{ color: cssVars.textMuted, marginBottom: 16 }} aria-hidden />
        <Typography sx={{ color: cssVars.textMuted, fontSize: '0.95rem' }}>{t('empty')}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        },
        gap: 2,
      }}
    >
      {playlists.map((pl) => (
        <PublicPlaylistCard key={pl.id} playlist={pl} />
      ))}
    </Box>
  );
}
