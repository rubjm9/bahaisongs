'use client';

import { useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import { cssVars } from '@/shared/theme/tokens';
import { AdminDrawerContext } from '../context/adminDrawerContext';

interface Props {
  children: ReactNode;
  pendingSuggestions?: number | undefined;
}

export function AdminShell({ children, pendingSuggestions }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AdminDrawerContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
      <Box sx={{ display: 'flex', minHeight: '100dvh', background: cssVars.bgPrimary }}>
        {/* Desktop sidebar */}
        <AdminSidebar pendingSuggestions={pendingSuggestions} />

        {/* Mobile drawer */}
        <AdminMobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          pendingSuggestions={pendingSuggestions}
        />

        {/* Main area — pages render their own topbar + content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </AdminDrawerContext.Provider>
  );
}
