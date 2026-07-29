import { Box, Stack, Typography } from '@mui/material';
import { cssVars, radii } from '@/shared/theme/tokens';
import type { CatalogGaps } from './chart-types';

interface GapRowProps {
  label: string;
  value: number;
  highlight?: boolean;
}

function GapRow({ label, value, highlight }: GapRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 1.5,
        py: 1,
        borderRadius: `${radii.md}px`,
        background: highlight && value > 0 ? 'rgba(245,158,11,0.08)' : 'transparent',
        border: highlight && value > 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
      }}
    >
      <Typography variant="body2" sx={{ color: cssVars.textPrimary, fontSize: '0.8125rem' }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          color: highlight && value > 0 ? '#F59E0B' : cssVars.textPrimary,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.toLocaleString('es')}
      </Typography>
    </Box>
  );
}

interface Props {
  gaps: CatalogGaps;
}

export function CatalogGapsPanel({ gaps }: Props) {
  return (
    <Stack spacing={0.5}>
      <GapRow label="Borradores sin publicar" value={gaps.drafts} highlight />
      <GapRow label="Sin audio" value={gaps.withoutAudio} highlight />
      <GapRow label="Sin letra" value={gaps.withoutLyrics} highlight />
      <GapRow label="Sin acordes" value={gaps.withoutChords} highlight />
      <GapRow label="Solo YouTube" value={gaps.youtubeOnly} />
      <GapRow label="Solo MP3" value={gaps.mp3Only} />
    </Stack>
  );
}
