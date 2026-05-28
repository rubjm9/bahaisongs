'use client';

import { Drawer } from '@mui/material';
import { AdminSidebar } from './AdminSidebar';

interface Props {
  open: boolean;
  onClose: () => void;
  pendingSuggestions?: number | undefined;
}

export function AdminMobileDrawer({ open, onClose, pendingSuggestions }: Props) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        display: { md: 'none' },
        '& .MuiDrawer-paper': {
          width: 220,
          border: 'none',
        },
      }}
    >
      <AdminSidebar pendingSuggestions={pendingSuggestions} />
    </Drawer>
  );
}

