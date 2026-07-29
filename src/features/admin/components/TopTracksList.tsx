import Link from 'next/link';
import { Box, Stack, Typography } from '@mui/material';
import { cssVars, radii } from '@/shared/theme/tokens';
import type { RankedTrack } from './chart-types';

interface Props {
  tracks: RankedTrack[];
  emptyMessage: string;
}

export function TopTracksList({ tracks, emptyMessage }: Props) {
  if (tracks.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: cssVars.textMuted, py: 2 }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {tracks.map((track, index) => (
        <Box
          key={track.id}
          component={Link}
          href={`/admin/tracks/${track.id}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 1.25,
            borderRadius: `${radii.md}px`,
            border: `1px solid ${cssVars.borderSubtle}`,
            textDecoration: 'none',
            transition: 'border-color 160ms, background 160ms',
            '&:hover': {
              borderColor: cssVars.borderStrong,
              background: cssVars.navActiveBg,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: cssVars.textMuted,
              fontWeight: 700,
              width: 20,
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {index + 1}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              flex: 1,
              color: cssVars.textPrimary,
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {track.title}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: cssVars.textMuted,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {track.count.toLocaleString('es')}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
