import { Box, Stack, Typography } from '@mui/material';
import { accent, cssVars } from '@/shared/theme/tokens';
import type { PlaylistLikeStats } from './chart-types';
import { MiniBarChart } from './MiniBarChart';

interface MetricProps {
  label: string;
  value: number;
  sub?: string;
  color?: string;
}

function Metric({ label, value, sub, color = cssVars.textPrimary }: MetricProps) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}
      >
        {value.toLocaleString('es')}
      </Typography>
      {sub && (
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
          {sub}
        </Typography>
      )}
    </Box>
  );
}

interface Props {
  stats: PlaylistLikeStats;
}

export function PlaylistsLikesPanel({ stats }: Props) {
  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 2,
        }}
      >
        <Metric label="Playlists" value={stats.totalPlaylists} />
        <Metric
          label="Favoritos"
          value={stats.totalLikes}
          sub={`+${stats.likesLast30Days.toLocaleString('es')} últimos 30 días`}
          color={accent.glow}
        />
      </Box>
      <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
        {stats.publicPlaylists} públicas · {stats.unlistedPlaylists} sin listar ·{' '}
        {stats.privatePlaylists} privadas
      </Typography>
      <MiniBarChart
        data={stats.playlistsByMonth}
        color={accent.indigo}
        ariaLabel="Playlists creadas por mes, últimos 6 meses"
        height={48}
      />
    </Stack>
  );
}
