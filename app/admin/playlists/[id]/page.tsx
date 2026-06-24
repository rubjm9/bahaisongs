import { notFound } from 'next/navigation';
import { Typography } from '@mui/material';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';
import { AdminPage } from '@/features/admin/components/AdminPage';
import { PlaylistTracksClient } from './PlaylistTracksClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.from('playlists').select('title').eq('id' as never, id).single();
  return { title: `Pistas — ${(data as { title?: string } | null)?.title ?? 'Playlist'}` };
}

export default async function PlaylistTracksPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  const { data: playlist } = await supabase
    .from('playlists')
    .select('id, title, slug')
    .eq('id' as never, id)
    .single();

  if (!playlist) notFound();

  const pl = playlist as { id: string; title: string; slug: string };

  const { data: playlistTracks } = await supabase
    .from('playlist_tracks')
    .select(`position, tracks (id, slug, title, primary_artist_id, artists:primary_artist_id (name))`)
    .eq('playlist_id' as never, id)
    .order('position' as never);

  const { data: allTracks } = await supabase
    .from('tracks')
    .select('id, slug, title, primary_artist_id, artists:primary_artist_id (name)')
    .order('title' as never)
    .limit(500);

  interface TrackRef { id: string; slug: string; title: string; artists: { name: string } | { name: string }[] | null }

  const currentTracks: TrackRef[] = ((playlistTracks ?? []) as { position: number; tracks: TrackRef | null }[])
    .sort((a, b) => a.position - b.position)
    .map((pt) => pt.tracks)
    .filter(Boolean) as TrackRef[];

  return (
    <AdminPage title={`Pistas: ${pl.title}`} maxWidth={900}>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Arrastra para reordenar. Los cambios se guardan al pulsar &quot;Guardar orden&quot;.
      </Typography>
      <PlaylistTracksClient
          playlistId={pl.id}
          currentTracks={currentTracks.map((t) => ({
            id: t.id,
            slug: t.slug,
            title: t.title,
            artistName: Array.isArray(t.artists) ? (t.artists[0]?.name ?? null) : (t.artists?.name ?? null),
          }))}
          allTracks={((allTracks ?? []) as TrackRef[]).map((t) => ({
            id: t.id,
            slug: t.slug,
            title: t.title,
            artistName: Array.isArray(t.artists) ? (t.artists[0]?.name ?? null) : (t.artists?.name ?? null),
          }))}
        />
    </AdminPage>
  );
}
