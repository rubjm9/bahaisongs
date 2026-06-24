'use client';

import { useEffect, type ReactNode } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { useAdminTopBarContext } from '../context/adminTopBarContext';

interface Props {
  title?: string;
  description?: string;
  actions?: ReactNode;
  maxWidth?: number | string;
  contentSx?: SxProps<Theme>;
  children: ReactNode;
}

export function AdminPage({
  title,
  description,
  actions,
  maxWidth = 1280,
  contentSx,
  children,
}: Props) {
  const { setConfig } = useAdminTopBarContext();

  useEffect(() => {
    setConfig({ title, description, actions });
    return () => setConfig({});
  }, [title, description, actions, setConfig]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: 3,
        maxWidth,
        mx: 'auto',
        width: '100%',
        ...contentSx,
      }}
    >
      {children}
    </Box>
  );
}
