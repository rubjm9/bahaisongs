'use client';

import { useCallback, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Share2, Check, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cssVars, radii, accent } from '@/shared/theme/tokens';
import { usePlaylists } from '../hooks/usePlaylists';

interface Props {
  playlistId: string;
  visibility: 'public' | 'private' | 'unlisted';
  isOwner: boolean;
}

export function PlaylistShareButton({ playlistId, visibility, isOwner }: Props) {
  const t = useTranslations('playlist');
  const { updateVisibility } = usePlaylists();
  const [copied, setCopied] = useState(false);
  const [making, setMaking] = useState(false);

  const canShare = visibility === 'public' || visibility === 'unlisted';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, []);

  const handleMakePublic = async () => {
    setMaking(true);
    await updateVisibility(playlistId, 'public');
    setMaking(false);
  };

  if (!canShare && isOwner) {
    return (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontSize: '0.8rem',
            color: cssVars.textMuted,
          }}
        >
          <Lock size={13} />
          {t('changeVisibilityToShare')}
        </Box>
        <Button
          size="small"
          variant="outlined"
          disabled={making}
          onClick={handleMakePublic}
          sx={{
            borderColor: cssVars.borderSubtle,
            color: cssVars.textPrimary,
            borderRadius: `${radii.md}px`,
            textTransform: 'none',
            fontSize: '0.8rem',
            '&:hover': { borderColor: cssVars.borderStrong },
          }}
        >
          {t('makePublic')}
        </Button>
      </Stack>
    );
  }

  if (!canShare) return null;

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={handleCopy}
      startIcon={copied ? <Check size={14} /> : <Share2 size={14} />}
      sx={{
        borderColor: copied ? accent.cyan : cssVars.borderSubtle,
        color: copied ? accent.cyan : cssVars.textPrimary,
        borderRadius: `${radii.md}px`,
        textTransform: 'none',
        fontSize: '0.85rem',
        fontWeight: 600,
        transition: 'border-color 200ms, color 200ms',
        '&:hover': { borderColor: cssVars.borderStrong },
      }}
    >
      <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
        {copied ? t('linkCopied') : t('sharePlaylist')}
      </Typography>
    </Button>
  );
}
