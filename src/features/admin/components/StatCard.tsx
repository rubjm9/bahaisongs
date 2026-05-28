'use client';

import { Box, Skeleton, Typography } from '@mui/material';
import { cssVars, radii } from '@/shared/theme/tokens';
import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: number | string | null;
  subtitle?: string;
  Icon?: LucideIcon;
  loading?: boolean;
  accent?: 'electric' | 'cyan' | 'indigo' | 'success' | 'warning';
}

const accentColorMap = {
  electric: '#1E90FF',
  cyan: '#4FD1FF',
  indigo: '#6366F1',
  success: 'var(--bs-status-success, #34D399)',
  warning: 'var(--bs-status-warning, #F59E0B)',
};

export function StatCard({ title, value, subtitle, Icon, loading = false, accent: accentKey = 'electric' }: Props) {
  const accentColor = accentColorMap[accentKey];

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${radii.lg}px`,
        background: cssVars.bgElevated,
        border: `1px solid ${cssVars.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 200ms',
        '&:hover': { borderColor: cssVars.borderStrong },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          borderRadius: `${radii.lg}px ${radii.lg}px 0 0`,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Typography
          variant="caption"
          sx={{
            color: cssVars.textMuted,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </Typography>
        {Icon && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: `${radii.md}px`,
              background: `${accentColor}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
          >
            <Icon size={16} />
          </Box>
        )}
      </Box>

      {loading ? (
        <Skeleton variant="text" width={80} height={40} />
      ) : (
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: cssVars.textPrimary,
            lineHeight: 1,
          }}
        >
          {value ?? '—'}
        </Typography>
      )}

      {subtitle && (
        <Typography variant="caption" sx={{ color: cssVars.textMuted, fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
