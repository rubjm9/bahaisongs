import 'server-only';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/shared/lib/supabase/server';
import type {
  CatalogGaps,
  ChartPoint,
  ChartSeries,
  PlaylistLikeStats,
  RankedTrack,
  StackedChartMonth,
} from '@/features/admin/components/chart-types';

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

export interface SuggestionFunnelTotals {
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  avgReviewHours: number | null;
}

const SUGGESTION_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#34D399',
  rejected: '#F87171',
  withdrawn: '#94A3B8',
};

const SUGGESTION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
};

/** Top tracks by play count in the last `days` days. */
export async function getTopPlayedTracks(limit = 10, days = 30): Promise<RankedTrack[]> {
  return getTopTracksFromEvents(limit, days);
}

/** Top tracks by like count (all time). */
export async function getTopLikedTracks(limit = 10): Promise<RankedTrack[]> {
  const supabase = await getSupabaseServerClient();

  const { data: likes } = await supabase.from('likes').select('track_id');
  if (!likes?.length) return [];

  const counts = new Map<string, number>();
  for (const row of likes as { track_id: string }[]) {
    counts.set(row.track_id, (counts.get(row.track_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, slug, title')
    .in('id' as never, topIds);

  const trackMap = new Map(
    ((tracks ?? []) as { id: string; slug: string; title: string }[]).map((t) => [t.id, t]),
  );

  return topIds
    .map((id) => {
      const track = trackMap.get(id);
      if (!track) return null;
      return { id, slug: track.slug, title: track.title, count: counts.get(id) ?? 0 };
    })
    .filter((t): t is RankedTrack => t !== null);
}

async function getTopTracksFromEvents(limit: number, days: number): Promise<RankedTrack[]> {
  const statsClient = getSupabaseServiceClient();
  const supabase = await getSupabaseServerClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await statsClient
    .from('play_events')
    .select('track_id')
    .gte('played_at' as never, since);

  if (!events?.length) return [];

  const counts = new Map<string, number>();
  for (const row of events as { track_id: string }[]) {
    counts.set(row.track_id, (counts.get(row.track_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, slug, title')
    .in('id' as never, topIds);

  const trackMap = new Map(
    ((tracks ?? []) as { id: string; slug: string; title: string }[]).map((t) => [t.id, t]),
  );

  return topIds
    .map((id) => {
      const track = trackMap.get(id);
      if (!track) return null;
      return { id, slug: track.slug, title: track.title, count: counts.get(id) ?? 0 };
    })
    .filter((t): t is RankedTrack => t !== null);
}

/** Tracks missing audio, lyrics, chords, or still in draft. */
export async function getCatalogGaps(): Promise<CatalogGaps> {
  const supabase = await getSupabaseServerClient();

  const [tracksRes, sourcesRes, lyricsRes] = await Promise.all([
    supabase.from('tracks').select('id, published_at'),
    supabase.from('track_sources').select('track_id, kind'),
    supabase.from('lyrics').select('track_id, has_chords, body_plain, body_chordpro'),
  ]);

  const tracks = (tracksRes.data ?? []) as { id: string; published_at: string | null }[];
  const sources = (sourcesRes.data ?? []) as { track_id: string; kind: string }[];
  const lyrics = (lyricsRes.data ?? []) as {
    track_id: string;
    has_chords: boolean;
    body_plain: string | null;
    body_chordpro: string | null;
  }[];

  const sourcesByTrack = new Map<string, string[]>();
  for (const s of sources) {
    const kinds = sourcesByTrack.get(s.track_id) ?? [];
    kinds.push(s.kind);
    sourcesByTrack.set(s.track_id, kinds);
  }

  const lyricsByTrack = new Map<string, { hasChords: boolean; hasLyrics: boolean }>();
  for (const l of lyrics) {
    const existing = lyricsByTrack.get(l.track_id) ?? { hasChords: false, hasLyrics: false };
    existing.hasChords = existing.hasChords || l.has_chords;
    const bodyPlain = l.body_plain?.trim();
    const bodyChordpro = l.body_chordpro?.trim();
    existing.hasLyrics =
      existing.hasLyrics || Boolean(bodyPlain) || Boolean(bodyChordpro);
    lyricsByTrack.set(l.track_id, existing);
  }

  let drafts = 0;
  let withoutAudio = 0;
  let withoutLyrics = 0;
  let withoutChords = 0;
  let youtubeOnly = 0;
  let mp3Only = 0;

  for (const track of tracks) {
    if (!track.published_at) drafts++;
    const kinds = sourcesByTrack.get(track.id) ?? [];
    if (kinds.length === 0) withoutAudio++;
    const hasYoutube = kinds.includes('youtube');
    const hasMp3 = kinds.includes('mp3_r2');
    if (hasYoutube && !hasMp3) youtubeOnly++;
    if (hasMp3 && !hasYoutube) mp3Only++;

    const lyricInfo = lyricsByTrack.get(track.id);
    if (!lyricInfo?.hasLyrics) withoutLyrics++;
    if (!lyricInfo?.hasChords) withoutChords++;
  }

  return {
    drafts,
    withoutAudio,
    withoutLyrics,
    withoutChords,
    youtubeOnly,
    mp3Only,
  };
}

/** Suggestions stacked by status per month, plus aggregate totals. */
export async function getSuggestionsFunnel(
  monthCount = 6,
): Promise<{ byMonth: StackedChartMonth[]; totals: SuggestionFunnelTotals }> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const months: { start: Date; end: Date; label: string }[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = startOfMonth(new Date(start.getFullYear(), start.getMonth() + 1, 1));
    months.push({ start, end, label: monthLabel(start) });
  }

  const { data } = await supabase.from('suggestions').select('status, created_at, reviewed_at');

  const rows = (data ?? []) as {
    status: string;
    created_at: string;
    reviewed_at: string | null;
  }[];

  const statuses = ['pending', 'approved', 'rejected', 'withdrawn'] as const;
  const byMonth: StackedChartMonth[] = months.map(({ start, end, label }) => {
    const inMonth = rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= start.getTime() && t < end.getTime();
    });
    return {
      label,
      segments: statuses.map((status) => ({
        key: status,
        label: SUGGESTION_STATUS_LABELS[status] ?? status,
        value: inMonth.filter((r) => r.status === status).length,
        color: SUGGESTION_STATUS_COLORS[status] ?? '#94A3B8',
      })),
    };
  });

  const totals: SuggestionFunnelTotals = {
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    withdrawn: rows.filter((r) => r.status === 'withdrawn').length,
    avgReviewHours: null,
  };

  const reviewed = rows.filter((r) => r.reviewed_at);
  if (reviewed.length > 0) {
    const totalHours = reviewed.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime();
      const reviewedAt = new Date(r.reviewed_at!).getTime();
      return sum + (reviewedAt - created) / (1000 * 60 * 60);
    }, 0);
    totals.avgReviewHours = Math.round(totalHours / reviewed.length);
  }

  return { byMonth, totals };
}

/** Playlist and like counts with monthly playlist growth. */
export async function getPlaylistLikeStats(monthCount = 6): Promise<PlaylistLikeStats> {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [playlistsRes, likesAll, likes30d] = await Promise.all([
    supabase.from('playlists').select('visibility, created_at'),
    supabase.from('likes').select('*', { count: 'exact', head: true }),
    supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .gte('liked_at' as never, thirtyDaysAgo),
  ]);

  const playlists = (playlistsRes.data ?? []) as {
    visibility: string;
    created_at: string;
  }[];

  const months: { start: Date; end: Date; label: string }[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1));
    const end = startOfMonth(new Date(start.getFullYear(), start.getMonth() + 1, 1));
    months.push({ start, end, label: monthLabel(start) });
  }

  const playlistsByMonth: ChartPoint[] = months.map(({ start, end, label }) => ({
    label,
    value: playlists.filter((p) => {
      const t = new Date(p.created_at).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length,
  }));

  return {
    totalPlaylists: playlists.length,
    publicPlaylists: playlists.filter((p) => p.visibility === 'public').length,
    unlistedPlaylists: playlists.filter((p) => p.visibility === 'unlisted').length,
    privatePlaylists: playlists.filter((p) => p.visibility === 'private').length,
    totalLikes: likesAll.count ?? 0,
    likesLast30Days: likes30d.count ?? 0,
    playlistsByMonth,
  };
}

function normalizePlaySource(source: string | null): string {
  if (!source) return 'Desconocido';
  if (source === 'player') return 'Reproductor';
  if (source === 'home') return 'Inicio';
  if (source === 'search') return 'Búsqueda';
  if (source.startsWith('playlist:')) return 'Playlist';
  return source;
}

/** Play events grouped by source label in the last `days` days. */
export async function getPlaySourceBreakdown(days = 30): Promise<ChartPoint[]> {
  const statsClient = getSupabaseServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await statsClient
    .from('play_events')
    .select('source')
    .gte('played_at' as never, since);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { source: string | null }[]) {
    const label = normalizePlaySource(row.source);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

/** Anonymous vs authenticated play share in the last `days` days. */
export async function getAnonymousPlayShare(days = 30): Promise<{ anonymous: number; authenticated: number }> {
  const statsClient = getSupabaseServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await statsClient
    .from('play_events')
    .select('user_id')
    .gte('played_at' as never, since);

  let anonymous = 0;
  let authenticated = 0;
  for (const row of (data ?? []) as { user_id: string | null }[]) {
    if (row.user_id) authenticated++;
    else anonymous++;
  }
  return { anonymous, authenticated };
}
