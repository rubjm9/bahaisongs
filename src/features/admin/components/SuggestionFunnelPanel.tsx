import { Box, Stack, Typography } from '@mui/material';
import type { SuggestionFunnelTotals } from '@/server/data/admin-stats';
import type { StackedChartMonth } from './chart-types';
import { MiniStackedBarChart } from './MiniStackedBarChart';
import { cssVars } from '@/shared/theme/tokens';

interface Props {
  byMonth: StackedChartMonth[];
  totals: SuggestionFunnelTotals;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendientes',
  approved: 'Aprobadas',
  rejected: 'Rechazadas',
  withdrawn: 'Retiradas',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#34D399',
  rejected: '#F87171',
  withdrawn: '#94A3B8',
};

export function SuggestionFunnelPanel({ byMonth, totals }: Props) {
  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
        {(['pending', 'approved', 'rejected', 'withdrawn'] as const).map((key) => (
          <Box key={key}>
            <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
              {STATUS_LABELS[key]}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: STATUS_COLORS[key],
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totals[key].toLocaleString('es')}
            </Typography>
          </Box>
        ))}
      </Box>
      {totals.avgReviewHours !== null && (
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
          Tiempo medio de revisión: {totals.avgReviewHours} h
        </Typography>
      )}
      <MiniStackedBarChart
        data={byMonth}
        ariaLabel="Sugerencias por estado y mes, últimos 6 meses"
      />
      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
        {(['pending', 'approved', 'rejected', 'withdrawn'] as const).map((key) => (
          <Stack key={key} direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[key] }} />
            <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.6875rem' }}>
              {STATUS_LABELS[key]}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
