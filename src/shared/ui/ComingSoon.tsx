'use client';

import { Box, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { GradientText } from './GradientText';
import { GlassPanel } from './GlassPanel';
import { accent, cssVars } from '@/shared/theme/tokens';

interface Props {
  title: string;
  phase?: string;
  description?: string;
  bullets?: string[];
}

/**
 * Placeholder used while the feature is being built in a later phase.
 * Phase 1 ships only the shell — every route renders one of these for now.
 */
export function ComingSoon({ title, phase, description, bullets }: Props) {
  return (
    <Stack
      spacing={4}
      sx={{ maxWidth: 720, paddingY: { xs: 4, md: 8 } }}
      component={motion.section}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box>
        {phase ? (
          <Typography
            sx={{
              color: accent.cyan,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              fontWeight: 600,
              mb: 1,
            }}
          >
            {phase}
          </Typography>
        ) : null}
        <Typography variant="h2" sx={{ fontSize: { xs: '2.25rem', md: '3rem' }, fontWeight: 700 }}>
          <GradientText variant="aurora">{title}</GradientText>
        </Typography>
      </Box>

      {description ? (
        <Typography sx={{ color: cssVars.textMuted, fontSize: '1.05rem', lineHeight: 1.6 }}>
          {description}
        </Typography>
      ) : null}

      {bullets && bullets.length > 0 ? (
        <GlassPanel sx={{ p: 3 }}>
          <Stack spacing={1.5} component="ul" sx={{ m: 0, paddingLeft: 0, listStyle: 'none' }}>
            {bullets.map((bullet, i) => (
              <Stack
                key={i}
                component="li"
                direction="row"
                spacing={1.5}
                sx={{ alignItems: 'flex-start' }}
              >
                <Box
                  aria-hidden
                  sx={{
                    mt: '0.6em',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: accent.cyan,
                    flexShrink: 0,
                    boxShadow: '0 0 12px rgba(79,209,255,0.6)',
                  }}
                />
                <Typography sx={{ color: cssVars.textPrimary, lineHeight: 1.5 }}>
                  {bullet}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </GlassPanel>
      ) : null}
    </Stack>
  );
}
