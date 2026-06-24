'use client';

import { Box, IconButton, Stack, Typography } from '@mui/material';
import { Menu } from 'lucide-react';
import { cssVars } from '@/shared/theme/tokens';
import { useAdminDrawer } from '../context/adminDrawerContext';

interface Props {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AdminTopBar({ title, description, actions }: Props) {
  const { openDrawer } = useAdminDrawer();

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '100%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2.5, md: 4 },
        py: { xs: 2, md: 2.5 },
        minHeight: 72,
        background: cssVars.bgElevated,
        borderBottom: `1px solid ${cssVars.borderSubtle}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Mobile menu button */}
      <IconButton
        aria-label="Abrir menú"
        onClick={openDrawer}
        sx={{ display: { md: 'none' }, mr: -1, color: cssVars.textMuted }}
      >
        <Menu size={20} />
      </IconButton>

      {title && (
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: cssVars.textPrimary, lineHeight: 1.3, fontSize: '1.125rem' }}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" sx={{ color: cssVars.textMuted, mt: 0.5, lineHeight: 1.5 }}>
              {description}
            </Typography>
          )}
        </Box>
      )}
      {!title && <Box sx={{ flex: 1 }} />}

      {actions && (
        <Stack direction="row" spacing={1} alignItems="center">
          {actions}
        </Stack>
      )}
    </Box>
  );
}
