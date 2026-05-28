import { Box } from '@mui/material';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { AdminTopBar } from '@/features/admin/components/AdminTopBar';
import { PlaylistsClient } from './PlaylistsClient';

interface PlaylistRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  is_curated: boolean;
  _track_count: number;
}

export default async function PlaylistsPage() {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from('playlists')
    .select(`id, slug, title, description, visibility, is_curated, playlist_tracks (track_id)`)
    .eq('is_curated' as never, true)
    .order('title' as never);

  interface RawPlaylist {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    visibility: string;
    is_curated: boolean;
    playlist_tracks: { track_id: string }[] | null;
  }

  const rows: PlaylistRow[] = ((data ?? []) as RawPlaylist[]).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    visibility: p.visibility,
    is_curated: p.is_curated,
    _track_count: (p.playlist_tracks ?? []).length,
  }));

  return (
    <>
      <AdminTopBar title="Playlists curadas" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 3, maxWidth: 1280, mx: 'auto' }}>
        <PlaylistsClient initialPlaylists={rows} />
      </Box>
    </>
  );
}
