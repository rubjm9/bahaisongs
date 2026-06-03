import { Box } from '@mui/material';
import { accent, accentExtended, cssVars, radii } from '@/shared/theme/tokens';
import { mergeSx } from '@/shared/ui/sx';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  title: string;
  /** Numeric pixels (e.g. 48) or CSS string (e.g. "100%"). */
  size?: number | string;
  sx?: SxProps<Theme>;
}

// 8 gradient pairs: [from-color, to-color, angle]
const GRADIENT_PALETTES: [string, string, number][] = [
  [accent.indigo, accent.cyan, 135],
  [accent.electric, accent.glow, 150],
  [accentExtended.magenta, accent.indigo, 120],
  [accent.indigo, accentExtended.violet, 160],
  [accentExtended.teal, accent.electric, 145],
  [accent.cyan, accentExtended.teal, 130],
  [accentExtended.amber, accent.glow, 140],
  [accentExtended.violet, accentExtended.magenta, 155],
];

/**
 * Typographic placeholder used in place of cover art. Per the design system
 * rule, no screen should depend on imagery to feel premium — we derive a
 * one-letter monogram from the title over a deterministic gradient.
 *
 * 8 palettes via hash so a list of placeholders has clear visual variety.
 */
export function TrackPlaceholder({ title, size = 48, sx }: Props) {
  const initial = title.trim().charAt(0).toUpperCase() || '·';
  const hash = simpleHash(title);
  const [from, to, angle] = GRADIENT_PALETTES[hash % 8]!;
  const isNumeric = typeof size === 'number';

  return (
    <Box
      aria-hidden
      sx={mergeSx(
        {
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: `${radii.md}px`,
          display: 'grid',
          placeItems: 'center',
          background: `linear-gradient(${angle}deg, ${from}55 0%, ${to}55 100%)`,
          color: cssVars.textPrimary,
          fontWeight: 700,
          fontSize: isNumeric ? `${Math.round(size * 0.42)}px` : '28%',
          letterSpacing: '0.04em',
          border: `1px solid ${cssVars.borderSubtle}`,
          textShadow: `0 0 18px ${to}55`,
        },
        sx,
      )}
    >
      {initial}
    </Box>
  );
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
