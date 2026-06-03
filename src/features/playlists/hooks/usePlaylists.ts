'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { useUser } from '@/features/auth/hooks/useUser';
import type { Playlist } from '@/entities/playlist';

interface CreatePlaylistInput {
  title: string;
  visibility: 'public' | 'private';
}

type PlaylistVisibility = 'public' | 'private' | 'unlisted';

function toPlaylist(row: Record<string, unknown>): Playlist {
  const pl: Playlist = {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    visibility: (row.visibility as 'public' | 'private' | 'unlisted') ?? 'private',
    tracks: [],
  };
  if (row.description) pl.description = row.description as string;
  if (row.owner_id) pl.ownerId = row.owner_id as string;
  if (row.cover_path) pl.coverPath = row.cover_path as string;
  return pl;
}

export function usePlaylists() {
  const { user, loading: userLoading } = useUser();
  const qc = useQueryClient();
  const queryKey = ['playlists', user?.id ?? null];

  const { data: playlists = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Playlist[]> => {
      if (!supabaseEnabled || !user) return [];
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at' as never, { ascending: false });
      if (error) return [];
      return (data as unknown as Record<string, unknown>[]).map(toPlaylist);
    },
    enabled: !userLoading && !!user,
    staleTime: 60_000,
  });

  const { mutateAsync: createPlaylist } = useMutation({
    mutationFn: async (input: CreatePlaylistInput): Promise<Playlist | null> => {
      if (!supabaseEnabled || !user) return null;
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      const slug = `${input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Date.now()}`;
      const payload = { title: input.title, slug, visibility: input.visibility, owner_id: user.id };
      const { data, error } = await supabase
        .from('playlists')
        .insert(payload as never)
        .select()
        .single();
      if (error) return null;
      return toPlaylist(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const { mutateAsync: deletePlaylist } = useMutation({
    mutationFn: async (playlistId: string): Promise<void> => {
      if (!supabaseEnabled || !user) return;
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      await supabase
        .from('playlists')
        .delete()
        .eq('id' as never, playlistId)
        .eq('owner_id' as never, user.id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const { mutateAsync: updateVisibility } = useMutation({
    mutationFn: async ({
      playlistId,
      visibility,
    }: {
      playlistId: string;
      visibility: PlaylistVisibility;
    }): Promise<void> => {
      if (!supabaseEnabled || !user) return;
      const { createClient } = await import('@/shared/lib/supabase/client');
      const supabase = createClient();
      await supabase
        .from('playlists')
        .update({ visibility, updated_at: new Date().toISOString() } as never)
        .eq('id' as never, playlistId)
        .eq('owner_id' as never, user.id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  return {
    playlists,
    loading: isLoading || userLoading,
    createPlaylist,
    deletePlaylist,
    updateVisibility: (playlistId: string, visibility: PlaylistVisibility) =>
      updateVisibility({ playlistId, visibility }),
  };
}
