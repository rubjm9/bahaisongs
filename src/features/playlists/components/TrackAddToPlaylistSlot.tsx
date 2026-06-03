'use client';

import type { MouseEvent } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { AddToPlaylistButton } from './AddToPlaylistButton';

interface Props {
  trackSlug: string;
  className?: string;
  sx?: SxProps<Theme>;
}

/** Client island: stops Link navigation when adding to a playlist from a track row/card. */
export function TrackAddToPlaylistSlot({ trackSlug, className, sx }: Props) {
  return (
    <Box
      {...(className !== undefined ? { className } : {})}
      {...(sx !== undefined ? { sx } : {})}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <AddToPlaylistButton trackSlug={trackSlug} />
    </Box>
  );
}
