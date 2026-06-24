import 'server-only';
import { cache } from 'react';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import { getSupabaseServerClient } from '@/shared/lib/supabase/server';

export interface PublicPlaylistSummary {
  id: string;
  slug: string;
  title: string;
  description?: string;
  trackCount: number;
  isCurated: boolean;
  ownerDisplayName?: string;
  updatedAt: string;
}

interface RawPublicPlaylist {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  is_curated: boolean;
  updated_at: string;
  playlist_tracks: { track_id: string }[] | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
}

function mapPublicPlaylist(row: RawPublicPlaylist): PublicPlaylistSummary {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const summary: PublicPlaylistSummary = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    trackCount: (row.playlist_tracks ?? []).length,
    isCurated: row.is_curated,
    updatedAt: row.updated_at,
  };
  if (row.description) summary.description = row.description;
  const displayName = profile?.display_name?.trim();
  if (displayName) summary.ownerDisplayName = displayName;
  return summary;
}

export const getPublicPlaylists = cache(async (): Promise<PublicPlaylistSummary[]> => {
  if (!supabaseEnabled) return [];

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('playlists')
      .select(
        `id, slug, title, description, visibility, is_curated, updated_at,
         playlist_tracks (track_id),
         profiles:owner_id (display_name)`,
      )
      .eq('visibility' as never, 'public')
      .order('updated_at' as never, { ascending: false });

    if (error || !data) return [];
    return (data as RawPublicPlaylist[]).map(mapPublicPlaylist);
  } catch {
    return [];
  }
});

export interface AdminPlaylistRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  is_curated: boolean;
  owner_id: string | null;
  owner_display_name: string | null;
  updated_at: string;
  _track_count: number;
}

interface RawAdminPlaylist {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  is_curated: boolean;
  owner_id: string | null;
  updated_at: string;
  playlist_tracks: { track_id: string }[] | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
}

export async function getAdminPlaylists(): Promise<AdminPlaylistRow[]> {
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from('playlists')
    .select(
      `id, slug, title, description, visibility, is_curated, owner_id, updated_at,
       playlist_tracks (track_id),
       profiles:owner_id (display_name)`,
    )
    .order('updated_at' as never, { ascending: false });

  return ((data ?? []) as RawAdminPlaylist[]).map((p) => {
    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      visibility: p.visibility,
      is_curated: p.is_curated,
      owner_id: p.owner_id,
      owner_display_name: profile?.display_name?.trim() ?? null,
      updated_at: p.updated_at,
      _track_count: (p.playlist_tracks ?? []).length,
    };
  });
}
