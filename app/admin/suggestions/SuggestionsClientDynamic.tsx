'use client';

import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';
import type { ComponentProps } from 'react';
import type { SuggestionsClient } from './SuggestionsClient';

const SuggestionsClientLazy = dynamic(
  () => import('./SuggestionsClient').then((mod) => mod.SuggestionsClient),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    ),
  },
);

export function SuggestionsClientDynamic(
  props: ComponentProps<typeof SuggestionsClient>,
) {
  return <SuggestionsClientLazy {...props} />;
}
