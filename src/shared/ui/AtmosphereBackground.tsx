'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
import { useBsTheme } from '@/shared/theme/useBsTheme';

interface Props {
  /** Visual intensity of the aurora and glow layers. */
  intensity?: 'low' | 'medium' | 'high';
  /** Whether the aurora should slowly drift. */
  animated?: boolean;
  /** Fixed full-bleed (true) or absolute-fill within a positioned parent (false). */
  fixed?: boolean;
}

const opacityByIntensity = {
  dark: {
    low: { aurora: 0.28, glow: 0.18 },
    medium: { aurora: 0.5, glow: 0.32 },
    high: { aurora: 0.72, glow: 0.5 },
  },
  light: {
    low: { aurora: 0.18, glow: 0.12 },
    medium: { aurora: 0.32, glow: 0.22 },
    high: { aurora: 0.48, glow: 0.34 },
  },
} as const;

export function AtmosphereBackground({
  intensity = 'medium',
  animated = true,
  fixed = false,
}: Props) {
  const { mode, gradients } = useBsTheme();
  const { aurora, glow } = opacityByIntensity[mode][intensity];
  const position = fixed ? 'fixed' : 'absolute';

  return (
    <>
      <Box
        component={motion.div}
        aria-hidden
        suppressHydrationWarning
        initial={animated ? { opacity: 0, scale: 1.05 } : false}
        animate={animated ? { opacity: aurora, scale: 1 } : { opacity: aurora }}
        transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
        sx={{
          position,
          inset: 0,
          background: gradients.aurora,
          filter: 'blur(80px) saturate(140%)',
          pointerEvents: 'none',
          zIndex: -2,
        }}
      />
      <Box
        aria-hidden
        suppressHydrationWarning
        sx={{
          position,
          inset: 0,
          background: gradients.glow,
          opacity: glow,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </>
  );
}
