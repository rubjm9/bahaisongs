'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { WifiOff } from 'lucide-react';
import { BrandMark } from '@/shared/ui/BrandMark';
import { cssVars } from '@/shared/theme/tokens';

interface Props {
  title: string;
  description: string;
  retry: string;
}

export function OfflineNotice({ title, description, retry }: Props) {
  return (
    <Stack
      spacing={3}
      sx={{
        minHeight: '60vh',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        py: 8,
      }}
    >
      <BrandMark size={48} showWordmark={false} />
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          color: cssVars.textMuted,
          border: `1px solid ${cssVars.borderSubtle}`,
        }}
      >
        <WifiOff size={28} aria-hidden />
      </Box>
      <Stack spacing={1} sx={{ maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: cssVars.textPrimary }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ color: cssVars.textMuted }}>
          {description}
        </Typography>
      </Stack>
      <Button
        variant="outlined"
        onClick={() => {
          window.location.reload();
        }}
        sx={{ borderRadius: 999, textTransform: 'none' }}
      >
        {retry}
      </Button>
    </Stack>
  );
}
