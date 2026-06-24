import { Box } from '@mui/material';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
import { getAdminPlaylists } from '@/server/data/playlists';
import { PlaylistsClient } from './PlaylistsClient';

export default async function PlaylistsPage() {
  const rows = await getAdminPlaylists();

  return (
    <>
      <AdminTopBar title="Playlists" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        <PlaylistsClient initialPlaylists={rows} />
      </Box>
    </>
  );
}
