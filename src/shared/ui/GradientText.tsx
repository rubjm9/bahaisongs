'use client';

import { Box, type BoxProps } from '@mui/material';
import { accent, cssVars } from '@/shared/theme/tokens';
import { mergeSx } from './sx';

interface GradientTextProps extends BoxProps {
  /** Predefined gradient or a custom one. */
  variant?: 'aurora' | 'cyan' | 'indigo' | 'cool';
}

const variantGradients: Record<NonNullable<GradientTextProps['variant']>, string> = {
  aurora: `linear-gradient(135deg, ${cssVars.textPrimary} 0%, ${accent.cyan} 100%)`,
  cyan: `linear-gradient(120deg, ${accent.glow} 0%, ${accent.cyan} 100%)`,
  indigo: `linear-gradient(135deg, ${accent.indigo} 0%, ${accent.electric} 100%)`,
  cool: `linear-gradient(180deg, ${cssVars.textPrimary} 0%, ${cssVars.textMuted} 100%)`,
};

export function GradientText({
  variant = 'aurora',
  component = 'span',
  sx,
  children,
  ...rest
}: GradientTextProps) {
  return (
    <Box
      component={component}
      sx={mergeSx(
        {
          background: variantGradients[variant],
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline',
        },
        sx,
      )}
      {...rest}
    >
      {children}
    </Box>
  );
}
