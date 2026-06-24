'use client';

import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { cssVars } from '@/shared/theme/tokens';
import type { ChartSeries } from './chart-types';

interface Props {
  series: ChartSeries[];
  ariaLabel: string;
}

const VB_W = 240;
const VB_H = 100;
const PAD = { top: 10, right: 8, bottom: 8, left: 8 };

function smoothLinePath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) {
    const p = coords[0]!;
    return `M ${p.x} ${p.y}`;
  }

  let path = `M ${coords[0]!.x} ${coords[0]!.y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i]!;
    const p1 = coords[i]!;
    const p2 = coords[i + 1]!;
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function formatMonthTooltip(monthLabel: string, series: ChartSeries[], index: number): string {
  const lines = series.map((s) => `${s.label}: ${(s.points[index]?.value ?? 0).toLocaleString('es')}`);
  return `${monthLabel}\n${lines.join('\n')}`;
}

export function MiniMultiLineChart({ series, ariaLabel }: Props) {
  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const pointCount = labels.length;
  const innerW = VB_W - PAD.left - PAD.right;
  const innerH = VB_H - PAD.top - PAD.bottom;

  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 1);
  const range = maxVal - minVal || 1;
  const yMin = Math.max(0, minVal - range * 0.1);
  const yMax = maxVal + range * 0.05;
  const ySpan = yMax - yMin || 1;

  const seriesCoords = series.map((s) =>
    s.points.map((point, index) => {
      const x =
        pointCount === 1
          ? PAD.left + innerW / 2
          : PAD.left + (index / (pointCount - 1)) * innerW;
      const y = PAD.top + innerH - ((point.value - yMin) / ySpan) * innerH;
      return { x, y, point };
    }),
  );

  return (
    <Box role="img" aria-label={ariaLabel} sx={{ width: '100%' }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2.4 / 1',
          minHeight: 168,
          maxHeight: 220,
        }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
          style={{ display: 'block' }}
        >
          {seriesCoords.map((coords, seriesIndex) => {
            const linePath = smoothLinePath(coords);
            const color = series[seriesIndex]!.color;
            return (
              <g key={series[seriesIndex]!.key}>
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {coords.map(({ x, y, point }) => (
                  <circle
                    key={`${series[seriesIndex]!.key}-${point.label}`}
                    cx={x}
                    cy={y}
                    r={1.6}
                    fill={cssVars.bgElevated}
                    stroke={color}
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                    style={{ pointerEvents: 'none' }}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {labels.map((label, index) => (
            <Tooltip
              key={label}
              title={
                <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
                  {formatMonthTooltip(label, series, index)}
                </Box>
              }
              arrow
              placement="top"
            >
              <Box sx={{ flex: 1, cursor: 'default' }} />
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
        {labels.map((label) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              color: cssVars.textMuted,
              fontSize: '0.6875rem',
              lineHeight: 1,
              textAlign: 'center',
              flex: 1,
              minWidth: 0,
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        justifyContent="center"
        sx={{ mt: 1.5, gap: 1.5, width: '100%' }}
      >
        {series.map((s) => (
          <Stack key={s.key} direction="row" alignItems="center" spacing={0.75}>
            <Box
              sx={{
                width: 14,
                height: 3,
                borderRadius: 1,
                background: s.color,
              }}
            />
            <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
              {s.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
