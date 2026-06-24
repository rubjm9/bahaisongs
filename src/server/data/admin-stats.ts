import 'server-only';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/shared/lib/supabase/server';
import type { ChartPoint, ChartSeries } from '@/features/admin/components/chart-types';

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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeekMonday(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('es', { month: 'short' }).replace(/\./g, '');
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace(/\./g, '');
}

/** New user signups grouped by calendar month (last `monthCount` months). */
export async function getNewUsersByMonth(monthCount = 6): Promise<ChartPoint[]> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const months: { start: Date; end: Date; label: string }[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = startOfMonth(new Date(start.getFullYear(), start.getMonth() + 1, 1));
    months.push({ start, end, label: monthLabel(start) });
  }

  const counts = await Promise.all(
    months.map(async ({ start, end }) => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at' as never, start.toISOString())
        .lt('created_at' as never, end.toISOString());
      return count ?? 0;
    }),
  );

  return months.map((month, index) => ({
    label: month.label,
    value: counts[index] ?? 0,
  }));
}

/** Catalog totals at month-end: tracks, tracks with audio, tracks with chords. */
export async function getCatalogHistoryByMonth(monthCount = 6): Promise<ChartSeries[]> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const monthEnds: { end: Date; label: string }[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = startOfMonth(new Date(start.getFullYear(), start.getMonth() + 1, 1));
    monthEnds.push({ end, label: monthLabel(start) });
  }

  const [tracksRes, sourcesRes, lyricsRes] = await Promise.all([
    supabase.from('tracks').select('id, created_at'),
    supabase.from('track_sources').select('track_id, created_at'),
    supabase
      .from('lyrics')
      .select('track_id, created_at')
      .eq('has_chords' as never, true),
  ]);

  const tracks = (tracksRes.data ?? []) as { id: string; created_at: string }[];
  const sources = (sourcesRes.data ?? []) as { track_id: string; created_at: string }[];
  const chordLyrics = (lyricsRes.data ?? []) as { track_id: string; created_at: string }[];

  const trackCreatedMs = new Map(
    tracks.map((t) => [t.id, new Date(t.created_at).getTime()] as const),
  );

  const totalPoints: ChartPoint[] = [];
  const audioPoints: ChartPoint[] = [];
  const chordsPoints: ChartPoint[] = [];

  for (const { end, label } of monthEnds) {
    const endMs = end.getTime();

    const total = tracks.filter((t) => new Date(t.created_at).getTime() < endMs).length;

    const audioIds = new Set(
      sources
        .filter((s) => {
          const trackMs = trackCreatedMs.get(s.track_id);
          return (
            trackMs !== undefined &&
            trackMs < endMs &&
            new Date(s.created_at).getTime() < endMs
          );
        })
        .map((s) => s.track_id),
    );

    const chordIds = new Set(
      chordLyrics
        .filter((l) => {
          const trackMs = trackCreatedMs.get(l.track_id);
          return (
            trackMs !== undefined &&
            trackMs < endMs &&
            new Date(l.created_at).getTime() < endMs
          );
        })
        .map((l) => l.track_id),
    );

    totalPoints.push({ label, value: total });
    audioPoints.push({ label, value: audioIds.size });
    chordsPoints.push({ label, value: chordIds.size });
  }

  return [
    { key: 'total', label: 'Canciones', color: '#1E90FF', points: totalPoints },
    { key: 'audio', label: 'Con audio', color: '#4FD1FF', points: audioPoints },
    { key: 'chords', label: 'Con acordes', color: '#6366F1', points: chordsPoints },
  ];
}

/** Suggestions received grouped by calendar month (last `monthCount` months). */
export async function getSuggestionsByMonth(monthCount = 6): Promise<ChartPoint[]> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const months: { start: Date; end: Date; label: string }[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = startOfMonth(new Date(start.getFullYear(), start.getMonth() + 1, 1));
    months.push({ start, end, label: monthLabel(start) });
  }

  const counts = await Promise.all(
    months.map(async ({ start, end }) => {
      const { count } = await supabase
        .from('suggestions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at' as never, start.toISOString())
        .lt('created_at' as never, end.toISOString());
      return count ?? 0;
    }),
  );

  return months.map((month, index) => ({
    label: month.label,
    value: counts[index] ?? 0,
  }));
}

/** Play events grouped by ISO week (Monday start), last `weekCount` weeks. */
export async function getPlaysByWeek(weekCount = 8): Promise<ChartPoint[]> {
  const statsClient = getSupabaseServiceClient();
  const now = new Date();
  const thisWeek = startOfWeekMonday(now);
  const weeks: { start: Date; end: Date; label: string }[] = [];

  for (let i = weekCount - 1; i >= 0; i--) {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    weeks.push({ start, end, label: weekLabel(start) });
  }

  const counts = await Promise.all(
    weeks.map(async ({ start, end }) => {
      const { count } = await statsClient
        .from('play_events')
        .select('*', { count: 'exact', head: true })
        .gte('played_at' as never, start.toISOString())
        .lt('played_at' as never, end.toISOString());
      return count ?? 0;
    }),
  );

  return weeks.map((week, index) => ({
    label: week.label,
    value: counts[index] ?? 0,
  }));
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
