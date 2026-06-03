'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { useUser } from '@/features/auth/hooks/useUser';
import type { PlaylistEntry } from '@/entities/playlist';

interface PlaylistTrackRow {
  position: number;
  added_at: string;
  track_id: string;
  track: {
    id: string;
    slug: string;
    title: string;
    language: string;
    primary_artist: { name: string } | null;
  } | null;
}

export function usePlaylistTracks(playlistId: string | null) {
  const { user } = useUser();
  const qc = useQueryClient();
  const queryKey = ['playlist-tracks', playlistId];

  const { data: tracks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<PlaylistEntry[]> => {
      if (!supabaseEnabled || !playlistId) return [];
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select(
          `position, added_at, track_id,
           track:tracks (
             id, slug, title, language,
             primary_artist:artists!primary_artist_id (name)
           )`,
        )
        .eq('playlist_id' as never, playlistId)
        .order('position' as never, { ascending: true });
      if (error) return [];
      const rows = data as unknown as PlaylistTrackRow[];
      return rows.map((row) => {
        const artistName = row.track?.primary_artist?.name;
        return {
          position: row.position,
          addedAt: row.added_at,
          track: {
            id: row.track?.id ?? row.track_id,
            slug: row.track?.slug ?? row.track_id,
            title: row.track?.title ?? '',
            language: row.track?.language ?? 'es',
            ...(artistName ? { primaryArtistName: artistName } : {}),
            hasChords: false,
            hasAudio: false,
          },
        };
      });
    },
    enabled: !!playlistId,
  });

  const { mutateAsync: addTrack } = useMutation({
    mutationFn: async (trackId: string): Promise<void> => {
      if (!supabaseEnabled || !playlistId || !user) return;
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const nextPos = tracks.length;
      await supabase.from('playlist_tracks').insert({
        playlist_id: playlistId,
        track_id: trackId,
        position: nextPos,
      } as never);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey }),
  });

  const { mutateAsync: removeTrack } = useMutation({
    mutationFn: async (trackId: string): Promise<void> => {
      if (!supabaseEnabled || !playlistId || !user) return;
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id' as never, playlistId)
        .eq('track_id' as never, trackId);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey }),
  });

  const { mutateAsync: reorderTracks } = useMutation<
    void,
    Error,
    string[],
    { prev?: PlaylistEntry[] }
  >({
    mutationFn: async (newOrder: string[]): Promise<void> => {
      if (!supabaseEnabled || !playlistId || !user) return;
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      await Promise.all(
        newOrder.map((trackId, idx) =>
          supabase
            .from('playlist_tracks')
            .update({ position: idx } as never)
            .eq('playlist_id' as never, playlistId)
            .eq('track_id' as never, trackId),
        ),
      );
    },
    onMutate: async (newOrder: string[]) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<PlaylistEntry[]>(queryKey);
      const reordered = newOrder.map((id, idx) => {
        const entry = tracks.find((t) => t.track.id === id || t.track.slug === id);
        return {
          ...(entry ?? {
            position: idx,
            addedAt: '',
            track: { id, slug: id, title: '', language: 'es', hasChords: false, hasAudio: false },
          }),
          position: idx,
        };
      });
      qc.setQueryData(queryKey, reordered);
      return prev ? { prev } : {};
    },
    onError: (_err: Error, _newOrder: string[], ctx?: { prev?: PlaylistEntry[] }) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey }),
  });

  return { tracks, loading: isLoading, addTrack, removeTrack, reorderTracks };
}
