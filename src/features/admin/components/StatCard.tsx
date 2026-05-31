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
        height: '100%',
        minHeight: 148,
        pt: 3.5,
        pb: 3,
        px: 3,
        borderRadius: `${radii.lg}px`,
        background: cssVars.bgElevated,
        border: `1px solid ${cssVars.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 200ms, box-shadow 200ms',
        '&:hover': {
          borderColor: cssVars.borderStrong,
          boxShadow: `0 8px 24px ${accentColor}12`,
        },
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
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: cssVars.textMuted,
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            lineHeight: 1.4,
            pt: 0.25,
          }}
        >
          {title}
        </Typography>
        {Icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: `${radii.md}px`,
              background: `${accentColor}14`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
          >
            <Icon size={18} strokeWidth={1.75} />
          </Box>
        )}
      </Box>

      {loading ? (
        <Skeleton variant="text" width={80} height={48} sx={{ mt: 'auto' }} />
      ) : (
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.25rem' },
            color: cssVars.textPrimary,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            mt: 'auto',
          }}
        >
          {value ?? '—'}
        </Typography>
      )}

      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: cssVars.textMuted, fontSize: '0.8125rem', lineHeight: 1.5 }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
