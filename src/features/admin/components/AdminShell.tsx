'use client';

import { useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { AdminSidebar } from './AdminSidebar';
import { AdminMobileDrawer } from './AdminMobileDrawer';
import { AdminTopBar } from './AdminTopBar';
import { cssVars } from '@/shared/theme/tokens';
import { AdminDrawerContext } from '../context/adminDrawerContext';
import { AdminTopBarProvider, useAdminTopBarContext } from '../context/adminTopBarContext';

interface Props {
  children: ReactNode;
  pendingSuggestions?: number | undefined;
}

function AdminShellLayout({
  children,
  pendingSuggestions,
  drawerOpen,
  onCloseDrawer,
}: Props & { drawerOpen: boolean; onCloseDrawer: () => void }) {
  const { config } = useAdminTopBarContext();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: cssVars.bgPrimary }}>
      <AdminTopBar
        {...(config.title !== undefined ? { title: config.title } : {})}
        {...(config.description !== undefined ? { description: config.description } : {})}
        {...(config.actions !== undefined ? { actions: config.actions } : {})}
      />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <AdminSidebar pendingSuggestions={pendingSuggestions} />

        <AdminMobileDrawer
          open={drawerOpen}
          onClose={onCloseDrawer}
          pendingSuggestions={pendingSuggestions}
        />

        <Box
          component="main"
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export function AdminShell({ children, pendingSuggestions }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AdminTopBarProvider>
      <AdminDrawerContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
        <AdminShellLayout
          pendingSuggestions={pendingSuggestions}
          drawerOpen={drawerOpen}
          onCloseDrawer={() => setDrawerOpen(false)}
        >
          {children}
        </AdminShellLayout>
      </AdminDrawerContext.Provider>
    </AdminTopBarProvider>
  );
}
