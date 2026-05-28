'use client';

import { Box, IconButton, Stack, Typography } from '@mui/material';
import { Menu } from 'lucide-react';
import { cssVars } from '@/shared/theme/tokens';
import { useAdminDrawer } from '../context/adminDrawerContext';

interface Props {
  title?: string;
  actions?: React.ReactNode;
}

export function AdminTopBar({ title, actions }: Props) {
  const { openDrawer } = useAdminDrawer();

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 2, md: 3 },
        height: 56,
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
        <Typography variant="body1" sx={{ fontWeight: 600, color: cssVars.textPrimary, flex: 1 }}>
          {title}
        </Typography>
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
