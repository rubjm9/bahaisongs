import { Box, Stack, Typography } from '@mui/material';
import { Music2, Play, Mic2 } from 'lucide-react';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { ChartSeries } from './chart-types';
import { MiniMultiLineChart } from './MiniMultiLineChart';

interface MetricProps {
  label: string;
  value: number;
  subtitle: string;
  icon: typeof Music2;
  color: string;
}

function CatalogMetric({ label, value, subtitle, icon: Icon, color }: MetricProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: `${radii.md}px`,
          background: `${color}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={1.75} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: cssVars.textMuted,
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'block',
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: cssVars.textPrimary,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.2,
          }}
        >
          {value.toLocaleString('es')}
        </Typography>
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

interface Props {
  totalTracks: number;
  publishedTracks: number;
  tracksWithAudio: number;
  tracksWithChords: number;
  history: ChartSeries[];
}

export function CatalogStatCard({
  totalTracks,
  publishedTracks,
  tracksWithAudio,
  tracksWithChords,
  history,
}: Props) {
  return (
    <Box
      sx={{
        gridColumn: { xs: '1', md: '1 / -1' },
        pt: 3.5,
        pb: 3,
        px: 3,
        borderRadius: `${radii.lg}px`,
        background: cssVars.bgElevated,
        border: `1px solid ${cssVars.borderSubtle}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 200ms, box-shadow 200ms',
        '&:hover': {
          borderColor: cssVars.borderStrong,
          boxShadow: `0 8px 24px ${accent.electric}12`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent.electric}, ${accent.cyan}, ${accent.indigo})`,
          borderRadius: `${radii.lg}px ${radii.lg}px 0 0`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { lg: 'center' },
          gap: { xs: 3, lg: 4 },
        }}
      >
        <Stack spacing={2.5} sx={{ flexShrink: 0, minWidth: { lg: 200 } }}>
          <CatalogMetric
            label="Canciones"
            value={totalTracks}
            subtitle={`${publishedTracks.toLocaleString('es')} publicadas`}
            icon={Music2}
            color={accent.electric}
          />
          <CatalogMetric
            label="Con audio"
            value={tracksWithAudio}
            subtitle="fuentes activas"
            icon={Play}
            color={accent.cyan}
          />
          <CatalogMetric
            label="Con acordes"
            value={tracksWithChords}
            subtitle="letras ChordPro"
            icon={Mic2}
            color={accent.indigo}
          />
        </Stack>

        <Box sx={{ flex: 1, minWidth: 0, width: '100%', py: { lg: 0.5 } }}>
          <MiniMultiLineChart
            series={history}
            ariaLabel="Evolución del catálogo al cierre de cada mes, últimos 6 meses"
          />
        </Box>
      </Box>
    </Box>
  );
}
