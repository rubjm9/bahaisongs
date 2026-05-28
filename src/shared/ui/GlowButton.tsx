'use client';

import { Button, type ButtonProps } from '@mui/material';
import { forwardRef } from 'react';
import { accent, cssVars } from '@/shared/theme/tokens';
import { mergeSx } from './sx';

interface GlowButtonProps extends Omit<ButtonProps, 'variant'> {
  /** Visual variant: solid (filled) or glass (translucent). */
  tone?: 'solid' | 'glass' | 'ghost';
}

export const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(function GlowButton(
  { tone = 'solid', sx, children, ...rest },
  ref,
) {
  const styles =
    tone === 'solid'
      ? {
          background: `linear-gradient(135deg, ${accent.electric} 0%, ${accent.cyan} 100%)`,
          color: cssVars.textInverse,
          boxShadow: cssVars.shadowGlow,
          '&:hover': {
            background: `linear-gradient(135deg, ${accent.cyan} 0%, ${accent.glow} 100%)`,
            boxShadow: cssVars.shadowGlowStrong,
          },
        }
      : tone === 'glass'
        ? {
            background: cssVars.bgGlass,
            color: cssVars.textPrimary,
            border: `1px solid ${cssVars.borderStrong}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            '&:hover': { boxShadow: cssVars.shadowGlow, background: cssVars.bgGlass },
          }
        : {
            background: 'transparent',
            color: cssVars.textPrimary,
            border: `1px solid transparent`,
            '&:hover': {
              background: cssVars.hoverSubtle,
              border: `1px solid ${cssVars.borderSubtle}`,
            },
          };

  return (
    <Button
      ref={ref}
      disableElevation
      sx={mergeSx(
        {
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 500,
          letterSpacing: '0.01em',
          paddingX: 3,
          paddingY: 1,
          ...styles,
        },
        sx,
      )}
      {...rest}
    >
      {children}
    </Button>
  );
});
