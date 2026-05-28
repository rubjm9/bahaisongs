import { Box } from '@mui/material';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import { mergeSx } from '@/shared/ui/sx';
import type { SxProps, Theme } from '@mui/material/styles';

interface Props {
  title: string;
  /** Numeric pixels (e.g. 48) or CSS string (e.g. "100%"). */
  size?: number | string;
  sx?: SxProps<Theme>;
}

/**
 * Typographic placeholder used in place of cover art. Per the design system
 * rule, no screen should depend on imagery to feel premium — we derive a
 * one-letter monogram from the title over the aurora gradient.
 *
 * The variation comes from a deterministic hash of the slug-ish title, which
 * picks one of four gradient rotations so a list of placeholders doesn't look
 * uniform.
 */
export function TrackPlaceholder({ title, size = 48, sx }: Props) {
  const initial = title.trim().charAt(0).toUpperCase() || '·';
  const hash = simpleHash(title);
  const rotation = (hash % 4) * 30 + 120; // 120, 150, 180, 210
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
          background: `linear-gradient(${rotation}deg, ${accent.indigo}55 0%, ${accent.electric}55 50%, ${accent.cyan}55 100%)`,
          color: cssVars.textPrimary,
          fontWeight: 700,
          fontSize: isNumeric ? `${Math.round(size * 0.42)}px` : '28%',
          letterSpacing: '0.04em',
          border: `1px solid ${cssVars.borderSubtle}`,
          textShadow: `0 0 18px ${accent.cyan}55`,
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
