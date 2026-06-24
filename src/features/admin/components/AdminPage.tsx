'use client';

import { useEffect, type ReactNode } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { useAdminTopBarContext, type AdminTopBarConfig } from '../context/adminTopBarContext';

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
    const config: AdminTopBarConfig = {};
    if (title !== undefined) config.title = title;
    if (description !== undefined) config.description = description;
    if (actions !== undefined) config.actions = actions;
    setConfig(config);
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
