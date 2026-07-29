import { Typography } from '@mui/material';
import { accent, cssVars } from '@/shared/theme/tokens';
import type { ChartPoint } from './chart-types';
import { MiniBarChart } from './MiniBarChart';

interface Props {
  sources: ChartPoint[];
  anonymous: number;
  authenticated: number;
}

export function PlaySourcePanel({ sources, anonymous, authenticated }: Props) {
  const total = anonymous + authenticated;

  if (sources.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: cssVars.textMuted, py: 2 }}>
        Sin reproducciones en el periodo.
      </Typography>
    );
  }

  return (
    <>
      <MiniBarChart
        data={sources}
        color={accent.cyan}
        ariaLabel="Reproducciones por origen, últimos 30 días"
        height={72}
      />
      {total > 0 && (
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem', mt: 1.5, display: 'block' }}>
          {Math.round((anonymous / total) * 100)}% anónimas ·{' '}
          {Math.round((authenticated / total) * 100)}% con sesión
        </Typography>
      )}
    </>
  );
}
