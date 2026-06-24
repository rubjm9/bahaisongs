import { AdminPage } from '@/features/admin/components/AdminPage';
import { getAdminPlaylists } from '@/server/data/playlists';
import { PlaylistsClient } from './PlaylistsClient';

export default async function PlaylistsPage() {
  const rows = await getAdminPlaylists();

  return (
    <AdminPage title="Playlists">
      <PlaylistsClient initialPlaylists={rows} />
    </AdminPage>
  );
}
