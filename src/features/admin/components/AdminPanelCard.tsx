import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { cssVars, radii } from '@/shared/theme/tokens';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  accentColor?: string;
}

export function AdminPanelCard({ title, description, children, accentColor }: Props) {
  return (
    <Box
      sx={{
        height: '100%',
        p: 3,
        borderRadius: `${radii.lg}px`,
        background: cssVars.bgElevated,
        border: `1px solid ${cssVars.borderSubtle}`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        '&::before': accentColor
          ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: accentColor,
            }
          : undefined,
      }}
    >
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: cssVars.textMuted,
            fontSize: '0.8125rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            display: 'block',
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: cssVars.textMuted, fontSize: '0.75rem', mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Box>
  );
}
