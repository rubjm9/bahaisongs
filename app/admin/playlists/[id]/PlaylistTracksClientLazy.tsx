'use client';

import nextDynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

const PlaylistTracksClient = nextDynamic(
  () => import('./PlaylistTracksClient').then((m) => m.PlaylistTracksClient),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    ),
  },
);

interface TrackRef {
  id: string;
  slug: string;
  title: string;
  artistName: string | null;
}

interface Props {
  playlistId: string;
  currentTracks: TrackRef[];
  allTracks: TrackRef[];
}

/** Client boundary so `ssr: false` keeps dnd-kit out of the Edge Function bundle. */
export function PlaylistTracksClientLazy(props: Props) {
  return <PlaylistTracksClient {...props} />;
}
