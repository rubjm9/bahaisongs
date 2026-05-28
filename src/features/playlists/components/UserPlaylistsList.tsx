'use client';

import { useState } from 'react';
import { Box, Stack, Typography, IconButton, CircularProgress, Button } from '@mui/material';
import { ListMusic, Trash2, PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { cssVars, radii } from '@/shared/theme/tokens';
import { usePlaylists } from '../hooks/usePlaylists';
import type { Locale } from '@/shared/lib/i18n/config';
import { appPath } from '@/shared/lib/seo/paths';
import { CreatePlaylistModal } from './CreatePlaylistModal';

export function UserPlaylistsList() {
  const t = useTranslations('playlist');
  const locale = useLocale() as Locale;
  const { playlists, loading, deletePlaylist } = usePlaylists();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    await deletePlaylist(id);
    setDeleting(null);
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          sx={{
            color: cssVars.textMuted,
            fontSize: '0.78rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {t('emptyPlaylists').replace('Todavía no tienes', '')}
        </Typography>
        <Button
          size="small"
          startIcon={<PlusCircle size={14} />}
          onClick={() => setCreateOpen(true)}
          sx={{
            color: cssVars.accentElectric,
            fontWeight: 600,
            fontSize: '0.8rem',
            textTransform: 'none',
          }}
        >
          {t('create')}
        </Button>
      </Stack>

      {playlists.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 8,
            color: cssVars.textMuted,
          }}
        >
          <ListMusic size={40} strokeWidth={1.5} />
          <Typography sx={{ fontSize: '0.95rem' }}>{t('emptyPlaylists')}</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlusCircle size={14} />}
            onClick={() => setCreateOpen(true)}
            sx={{
              borderColor: cssVars.borderSubtle,
              color: cssVars.textPrimary,
              borderRadius: `${radii.md}px`,
              textTransform: 'none',
              '&:hover': { borderColor: cssVars.borderStrong },
            }}
          >
            {t('create')}
          </Button>
        </Box>
      ) : (
        <Stack spacing={1}>
          {playlists.map((pl) => (
            <Box
              key={pl.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.5,
                borderRadius: `${radii.sm}px`,
                background: cssVars.bgGlass,
                border: `1px solid ${cssVars.borderSubtle}`,
                '&:hover': { borderColor: cssVars.borderStrong },
                transition: 'border-color 160ms',
              }}
            >
              <ListMusic size={16} style={{ color: cssVars.textMuted, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Link href={appPath(locale, `playlist/${pl.slug}`)} style={{ textDecoration: 'none' }}>
                  <Box
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: cssVars.textPrimary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      '&:hover': { color: cssVars.accentElectric },
                      transition: 'color 160ms',
                    }}
                  >
                    {pl.title}
                  </Box>
                </Link>
                <Box sx={{ fontSize: '0.75rem', color: cssVars.textMuted }}>{pl.visibility}</Box>
              </Box>
              <IconButton
                size="small"
                onClick={() => handleDelete(pl.id)}
                disabled={deleting === pl.id}
                aria-label="Delete playlist"
                sx={{ color: cssVars.textMuted, '&:hover': { color: '#ef4444' } }}
              >
                {deleting === pl.id ? <CircularProgress size={14} /> : <Trash2 size={14} />}
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}

      <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}
