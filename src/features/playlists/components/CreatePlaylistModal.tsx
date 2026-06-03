'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cssVars, radii } from '@/shared/theme/tokens';
import { usePlaylists } from '../hooks/usePlaylists';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { addTrackToPlaylist } from '../lib/playlist-tracks';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, the new playlist receives this track after creation. */
  trackSlug?: string;
}

export function CreatePlaylistModal({ open, onClose, trackSlug }: Props) {
  const t = useTranslations('playlist');
  const { createPlaylist } = usePlaylists();
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setLoading(true);
    const playlist = await createPlaylist({ title: title.trim(), visibility });

    if (playlist && trackSlug && supabaseEnabled) {
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      await addTrackToPlaylist(supabase, playlist.id, trackSlug);
    }

    setLoading(false);
    setTitle('');
    setVisibility('private');
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          background: cssVars.bgElevated,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: `${radii.lg}px`,
        },
      }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: cssVars.textPrimary }}>
          {t('create')}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="close">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t('titleLabel')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            fullWidth
            size="small"
            autoFocus
            disabled={loading}
          />

          <FormControl fullWidth size="small">
            <InputLabel>{t('visibility')}</InputLabel>
            <Select
              value={visibility}
              label={t('visibility')}
              onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              disabled={loading}
            >
              <MenuItem value="public">{t('public')}</MenuItem>
              <MenuItem value="private">{t('private')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ color: cssVars.textMuted, borderRadius: `${radii.md}px` }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          sx={{
            background: cssVars.accentElectric,
            color: cssVars.textInverse,
            fontWeight: 600,
            borderRadius: `${radii.md}px`,
            '&:hover': { background: cssVars.accentCyan },
          }}
        >
          {loading ? <CircularProgress size={18} /> : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
