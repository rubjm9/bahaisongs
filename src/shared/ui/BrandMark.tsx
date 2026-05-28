'use client';

import { useId } from 'react';
import { Box } from '@mui/material';
import { accent, cssVars } from '@/shared/theme/tokens';

type BrandMarkIcon = 'star' | 'monogram';

interface Props {
  size?: number;
  label?: string;
  showWordmark?: boolean;
  /** Sidebar uses a compact "BS" badge instead of the nine-pointed star. */
  icon?: BrandMarkIcon;
  monogram?: string;
}

/**
 * Brand mark — nine-pointed star (Bahá'í symbology) or compact monogram,
 * paired optionally with a typographic wordmark.
 */
export function BrandMark({
  size = 32,
  label = 'BahaiSongs',
  showWordmark = true,
  icon = 'star',
  monogram = 'BS',
}: Props) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.25,
        userSelect: 'none',
        color: cssVars.textPrimary,
      }}
      aria-label={label}
    >
      {icon === 'star' ? <NineStar size={size} /> : <MonogramBadge text={monogram} size={size} />}
      {showWordmark && (
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: '1.05rem',
            letterSpacing: '-0.005em',
            whiteSpace: 'nowrap',
            background: `linear-gradient(135deg, ${cssVars.textPrimary} 0%, ${accent.cyan} 120%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {label}
        </Box>
      )}
    </Box>
  );
}

function MonogramBadge({ text, size }: { text: string; size: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: `${Math.round(size * 0.28)}px`,
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: '-0.04em',
        color: cssVars.textPrimary,
        background: `linear-gradient(135deg, ${accent.glow}22 0%, ${accent.cyan}33 100%)`,
        border: `1px solid ${accent.cyan}44`,
        boxShadow: `0 0 12px ${accent.cyan}33`,
      }}
    >
      {text}
    </Box>
  );
}

function NineStar({ size }: { size: number }) {
  const id = useId();
  const gradId = `bm-grad-${id.replace(/:/g, '')}`;
  const points = 9;
  const r1 = 14;
  const r2 = 5.6;
  const cx = 16;
  const cy = 16;
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    coords.push(
      `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{ filter: `drop-shadow(0 0 8px ${accent.cyan}66)` }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent.glow} />
          <stop offset="100%" stopColor={accent.cyan} />
        </linearGradient>
      </defs>
      <polygon points={coords.join(' ')} fill={`url(#${gradId})`} opacity="0.95" />
    </svg>
  );
}
