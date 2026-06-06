import 'server-only';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/shared/lib/supabase/server';

export interface AdminStats {
  totalTracks: number;
  publishedTracks: number;
  tracksWithAudio: number;
  tracksWithChords: number;
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  pendingSuggestions: number;
  totalPlaylists: number;
  totalPlays: number;
  playsLast7Days: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await getSupabaseServerClient();
  const statsClient = getSupabaseServiceClient();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    tracksAll,
    tracksPublished,
    tracksAudio,
    tracksChords,
    users,
    users7d,
    users30d,
    suggestions,
    playlists,
    playsAll,
    plays7d,
  ] = await Promise.all([
    supabase.from('tracks').select('*', { count: 'exact', head: true }),
    supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .not('published_at' as never, 'is', null),
    supabase
      .from('track_sources')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('lyrics')
      .select('*', { count: 'exact', head: true })
      .eq('has_chords' as never, true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at' as never, sevenDaysAgo),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at' as never, thirtyDaysAgo),
    supabase
      .from('suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('status' as never, 'pending'),
    supabase.from('playlists').select('*', { count: 'exact', head: true }),
    statsClient.from('play_events').select('*', { count: 'exact', head: true }),
    statsClient
      .from('play_events')
      .select('*', { count: 'exact', head: true })
      .gte('played_at' as never, sevenDaysAgo),
  ]);

  return {
    totalTracks: tracksAll.count ?? 0,
    publishedTracks: tracksPublished.count ?? 0,
    tracksWithAudio: tracksAudio.count ?? 0,
    tracksWithChords: tracksChords.count ?? 0,
    totalUsers: users.count ?? 0,
    newUsersLast7Days: users7d.count ?? 0,
    newUsersLast30Days: users30d.count ?? 0,
    pendingSuggestions: suggestions.count ?? 0,
    totalPlaylists: playlists.count ?? 0,
    totalPlays: playsAll.count ?? 0,
    playsLast7Days: plays7d.count ?? 0,
  };
}

export interface RecentSuggestion {
  id: string;
  status: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export async function getRecentSuggestions(limit = 5): Promise<RecentSuggestion[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('suggestions')
    .select('id, status, created_at, payload')
    .order('created_at' as never, { ascending: false })
    .limit(limit);

  return data ?? [];
}
