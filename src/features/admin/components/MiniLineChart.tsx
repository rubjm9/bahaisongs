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

const CHART_PAD = { top: 6, right: 4, bottom: 0, left: 4 };

function formatTooltip(point: ChartPoint): string {
  return `${point.label}: ${point.value.toLocaleString('es')}`;
}

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

export function MiniLineChart({ data, color, ariaLabel, height = 64 }: Props) {
  const chartHeight = height - 16;
  const width = 280;
  const innerW = width - CHART_PAD.left - CHART_PAD.right;
  const innerH = chartHeight - CHART_PAD.top - CHART_PAD.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const bottomY = CHART_PAD.top + innerH;

  const coords = data.map((point, index) => {
    const x =
      data.length === 1
        ? CHART_PAD.left + innerW / 2
        : CHART_PAD.left + (index / (data.length - 1)) * innerW;
    const y = CHART_PAD.top + innerH - (point.value / max) * innerH;
    return { x, y, point };
  });

  const linePath = smoothLinePath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath =
    last && first
      ? `${linePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
      : '';

  return (
    <Box
      role="img"
      aria-label={ariaLabel}
      sx={{ mt: 0.5, pt: 1, borderTop: `1px solid ${cssVars.borderSubtle}` }}
    >
      <Box sx={{ position: 'relative', width: '100%' }}>
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          width="100%"
          height={chartHeight}
          preserveAspectRatio="none"
          aria-hidden
          style={{ display: 'block' }}
        >
          {areaPath && <path d={areaPath} fill={`${color}22`} stroke="none" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {coords.map(({ x, y, point }) => (
            <circle
              key={point.label}
              cx={x}
              cy={y}
              r={3}
              fill={cssVars.bgElevated}
              stroke={color}
              strokeWidth={2}
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </svg>

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          {coords.map(({ point }) => (
            <Tooltip key={point.label} title={formatTooltip(point)} arrow placement="top">
              <Box sx={{ flex: 1, cursor: 'default' }} />
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.25 }}>
        {data.map((point) => (
          <Typography
            key={point.label}
            variant="caption"
            sx={{
              color: cssVars.textMuted,
              fontSize: '0.625rem',
              lineHeight: 1,
              textAlign: 'center',
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {point.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
