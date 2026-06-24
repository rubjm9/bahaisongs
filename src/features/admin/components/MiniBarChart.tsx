'use client';

import { Box, Tooltip, Typography } from '@mui/material';
import { cssVars } from '@/shared/theme/tokens';
import type { ChartPoint } from './chart-types';

interface Props {
  data: ChartPoint[];
  color: string;
  ariaLabel: string;
  height?: number;
}

function formatTooltip(point: ChartPoint): string {
  return `${point.label}: ${point.value.toLocaleString('es')}`;
}

export function MiniBarChart({ data, color, ariaLabel, height = 52 }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <Box
      role="img"
      aria-label={ariaLabel}
      sx={{ mt: 0.5, pt: 1, borderTop: `1px solid ${cssVars.borderSubtle}` }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0.5,
          height,
        }}
      >
        {data.map((point) => {
          const barHeight = point.value > 0 ? Math.max((point.value / max) * 100, 12) : 4;

          return (
            <Tooltip key={point.label} title={formatTooltip(point)} arrow placement="top">
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'default',
                  '&:hover .chart-bar': {
                    opacity: point.value > 0 ? 0.8 : 0.5,
                  },
                }}
              >
                <Box
                  className="chart-bar"
                  sx={{
                    width: '100%',
                    maxWidth: 28,
                    height: `${barHeight}%`,
                    borderRadius: '3px 3px 0 0',
                    background: point.value > 0 ? color : cssVars.borderSubtle,
                    opacity: point.value > 0 ? 1 : 0.35,
                    transition: 'opacity 160ms',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: cssVars.textMuted,
                    fontSize: '0.625rem',
                    lineHeight: 1,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    pointerEvents: 'none',
                  }}
                >
                  {point.label}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
