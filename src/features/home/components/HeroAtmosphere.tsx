'use client';

import Link from 'next/link';
import { Typography, Stack, Box } from '@mui/material';
import { motion } from 'framer-motion';
import { GradientText } from '@/shared/ui/GradientText';
import { GlowButton } from '@/shared/ui/GlowButton';
import { accent, cssVars, radii } from '@/shared/theme/tokens';

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaSuggest: string;
  ctaHref: string;
  ctaSuggestHref: string;
  heroStatCount?: number;
  heroStatLabel?: string;
}

export function HeroAtmosphere({
  eyebrow,
  title,
  subtitle,
  cta,
  ctaSuggest,
  ctaHref,
  ctaSuggestHref,
  heroStatCount,
  heroStatLabel,
}: Props) {
  return (
    <Stack
      spacing={{ xs: 2.5, md: 4 }}
      sx={{
        maxWidth: 880,
        mx: 'auto',
        paddingY: { xs: 3, md: 8 },
        position: 'relative',
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          component="p"
          sx={{
            color: cssVars.textMuted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            fontWeight: 500,
            m: 0,
          }}
        >
          {eyebrow}
        </Typography>
        {heroStatCount != null && heroStatLabel ? (
          <Box
            component="p"
            role="status"
            sx={{
              m: 0,
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: radii.pill,
              background: cssVars.bgGlass,
              border: `1px solid ${cssVars.borderSubtle}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: `0 0 24px ${accent.cyan}14`,
            }}
          >
            <Typography
              component="span"
              sx={{
                color: accent.cyan,
                fontWeight: 700,
                fontSize: '1rem',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {heroStatCount.toLocaleString()}
            </Typography>
            <Typography
              component="span"
              sx={{
                color: cssVars.textMuted,
                fontSize: '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              {heroStatLabel}
            </Typography>
          </Box>
        ) : null}
      </Box>

      <Typography
        component={motion.h1}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        variant="h1"
        sx={{
          fontSize: 'clamp(1.9rem, 5vw + 0.5rem, 4.5rem)',
          lineHeight: 1.05,
          fontWeight: 700,
          m: 0,
        }}
      >
        <GradientText variant="aurora">{title}</GradientText>
      </Typography>

      <Typography
        component={motion.p}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.7 }}
        sx={{
          color: cssVars.textMuted,
          fontSize: { xs: '1.05rem', md: '1.25rem' },
          maxWidth: 720,
          lineHeight: 1.55,
          m: 0,
        }}
      >
        {subtitle}
      </Typography>

      <Stack
        component={motion.div}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        sx={{ mt: 1, alignItems: { xs: 'stretch', sm: 'center' } }}
      >
        <Link href={ctaHref} style={{ textDecoration: 'none' }}>
          <GlowButton tone="solid" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {cta}
          </GlowButton>
        </Link>
        <Link href={ctaSuggestHref} style={{ textDecoration: 'none' }}>
          <GlowButton tone="glass" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {ctaSuggest}
          </GlowButton>
        </Link>
      </Stack>
    </Stack>
  );
}
