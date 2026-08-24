'use client';

import type { MouseEvent } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import { LikeButton } from '@/features/favorites/components/LikeButton';

interface Props {
  trackSlug: string;
  className?: string;
  sx?: SxProps<Theme>;
  size?: number;
}

/** Client island: stops Link navigation when liking from a track row/card. */
export function TrackLikeSlot({ trackSlug, className, sx, size = 18 }: Props) {
  return (
    <Box
      {...(className !== undefined ? { className } : {})}
      {...(sx !== undefined ? { sx } : {})}
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <LikeButton trackId={trackSlug} trackSlug={trackSlug} size={size} />
    </Box>
  );
}
