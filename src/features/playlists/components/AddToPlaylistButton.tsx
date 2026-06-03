'use client';

import { useState } from 'react';
import {
  IconButton,
  Popover,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Divider,
  Typography,
  Button,
} from '@mui/material';
import { ListPlus, PlusCircle, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cssVars, radii } from '@/shared/theme/tokens';
import { usePlaylists } from '../hooks/usePlaylists';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { useUser } from '@/features/auth/hooks/useUser';
import { useLoginPrompt } from '@/features/auth/hooks/useLoginPrompt';
import { supabaseEnabled } from '@/shared/lib/supabase/env';

interface Props {
  trackId: string;
}

async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  if (!supabaseEnabled) return;
  const { createClient } = await import('@/shared/lib/supabase/client');
  const supabase = createClient();
  const { data: existing } = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id' as never, playlistId)
    .order('position' as never, { ascending: false })
    .limit(1);
  const nextPos = (existing as unknown as { position: number }[] | null)?.[0]?.position ?? -1;
  await supabase.from('playlist_tracks').upsert({
    playlist_id: playlistId,
    track_id: trackId,
    position: nextPos + 1,
  } as never);
}

export function AddToPlaylistButton({ trackId }: Props) {
  const t = useTranslations('playlist');
  const { user } = useUser();
  const openLogin = useLoginPrompt((s) => s.open);
  const { playlists, loading } = usePlaylists();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  async function handleAddToPlaylist(playlistId: string) {
    setAdding(playlistId);
    await addTrackToPlaylist(playlistId, trackId);
    setAdding(null);
    setAnchorEl(null);
  }

  if (!user) {
    return (
      <>
        <IconButton
          size="small"
          aria-label={t('signInToAddToPlaylist')}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ color: cssVars.textMuted, '&:hover': { color: cssVars.accentElectric } }}
        >
          <ListPlus size={18} />
        </IconButton>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              background: cssVars.bgElevated,
              border: `1px solid ${cssVars.borderSubtle}`,
              borderRadius: `${radii.md}px`,
              minWidth: 220,
              p: 2,
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography sx={{ fontSize: '0.85rem', color: cssVars.textPrimary, fontWeight: 500 }}>
              {t('signInToAddToPlaylist')}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<LogIn size={14} />}
              onClick={() => {
                setAnchorEl(null);
                openLogin();
              }}
              sx={{
                background: cssVars.accentElectric,
                color: cssVars.textInverse,
                fontWeight: 600,
                borderRadius: `${radii.md}px`,
                textTransform: 'none',
                '&:hover': { background: cssVars.accentCyan },
              }}
            >
              {t('signIn')}
            </Button>
          </Box>
        </Popover>
      </>
    );
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('addTrack')}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: cssVars.textMuted, '&:hover': { color: cssVars.accentElectric } }}
      >
        <ListPlus size={18} />
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            background: cssVars.bgElevated,
            border: `1px solid ${cssVars.borderSubtle}`,
            borderRadius: `${radii.md}px`,
            minWidth: 200,
            maxHeight: 300,
            overflow: 'auto',
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: cssVars.textMuted,
              px: 1,
              pb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {t('addTrack')}
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : (
            <List dense disablePadding>
              {playlists.map((pl) => (
                <ListItem key={pl.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleAddToPlaylist(pl.id)}
                    disabled={adding === pl.id}
                    sx={{ borderRadius: `${radii.sm}px`, color: cssVars.textPrimary }}
                  >
                    <ListItemText
                      primary={pl.title}
                      primaryTypographyProps={{ fontSize: '0.88rem' }}
                    />
                    {adding === pl.id ? <CircularProgress size={14} /> : null}
                  </ListItemButton>
                </ListItem>
              ))}
              {playlists.length > 0 ? <Divider sx={{ my: 0.5 }} /> : null}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    setAnchorEl(null);
                    setCreateOpen(true);
                  }}
                  sx={{ borderRadius: `${radii.sm}px`, color: cssVars.accentElectric }}
                >
                  <PlusCircle size={14} style={{ marginRight: 8 }} />
                  <ListItemText
                    primary={t('newPlaylist')}
                    primaryTypographyProps={{ fontSize: '0.88rem' }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          )}
        </Box>
      </Popover>

      <CreatePlaylistModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
