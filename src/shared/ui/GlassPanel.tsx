'use client';

import { Box, type BoxProps } from '@mui/material';
import { forwardRef } from 'react';
import { cssVars, radii } from '@/shared/theme/tokens';
import { mergeSx } from './sx';

interface GlassPanelProps extends BoxProps {
  /** Visual elevation — affects border, blur intensity and shadow. */
  elevation?: 'flat' | 'raised' | 'floating';
  /** Border radius variant from the design tokens. */
  radius?: keyof typeof radii;
}

const elevationStyles = {
  flat: {
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: 'none',
  },
  raised: {
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: cssVars.shadowCard,
  },
  floating: {
    backdropFilter: 'blur(24px) saturate(140%)',
    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    boxShadow: `${cssVars.shadowCard}, ${cssVars.shadowGlow}`,
  },
} as const;

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel(
  { elevation = 'raised', radius = 'lg', sx, children, ...rest },
  ref,
) {
  return (
    <Box
      ref={ref}
      sx={mergeSx(
        {
          background: cssVars.bgGlass,
          border: `1px solid ${cssVars.borderSubtle}`,
          borderRadius: `${radii[radius]}px`,
          color: cssVars.textPrimary,
          ...elevationStyles[elevation],
        },
        sx,
      )}
      {...rest}
    >
      {children}
    </Box>
  );
});
