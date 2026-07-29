'use client';

import { Box, Tooltip, Typography } from '@mui/material';
import { cssVars } from '@/shared/theme/tokens';
import type { StackedChartMonth } from './chart-types';

interface Props {
  data: StackedChartMonth[];
  ariaLabel: string;
  height?: number;
}

export function MiniStackedBarChart({ data, ariaLabel, height = 100 }: Props) {
  const maxTotal = Math.max(
    ...data.map((m) => m.segments.reduce((sum, s) => sum + s.value, 0)),
    1,
  );

  return (
    <Box role="img" aria-label={ariaLabel} sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0.75,
          height,
        }}
      >
        {data.map((month) => {
          const total = month.segments.reduce((sum, s) => sum + s.value, 0);
          const tooltip = [
            month.label,
            ...month.segments
              .filter((s) => s.value > 0)
              .map((s) => `${s.label}: ${s.value.toLocaleString('es')}`),
          ].join('\n');

          return (
            <Tooltip
              key={month.label}
              title={<Box component="span" sx={{ whiteSpace: 'pre-line' }}>{tooltip}</Box>}
              arrow
              placement="top"
            >
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'default',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: 32,
                    height: total > 0 ? `${Math.max((total / maxTotal) * 100, 8)}%` : '4px',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    borderRadius: '3px 3px 0 0',
                    overflow: 'hidden',
                    opacity: total > 0 ? 1 : 0.35,
                  }}
                >
                  {month.segments.map((seg) =>
                    seg.value > 0 ? (
                      <Box
                        key={seg.key}
                        sx={{
                          width: '100%',
                          flex: seg.value,
                          minHeight: 2,
                          background: seg.color,
                        }}
                      />
                    ) : null,
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: cssVars.textMuted,
                    fontSize: '0.625rem',
                    lineHeight: 1,
                    textAlign: 'center',
                  }}
                >
                  {month.label}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
