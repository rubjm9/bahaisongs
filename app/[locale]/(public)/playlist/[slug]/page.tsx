import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Stack, Typography, Box, Chip } from '@mui/material';
import { GradientText } from '@/shared/ui/GradientText';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { accent, cssVars } from '@/shared/theme/tokens';
import { PlaylistEditorWrapper } from '@/features/playlists/components/PlaylistEditorWrapper';
import { PlaylistShareButton } from '@/features/playlists/components/PlaylistShareButton';
import { supabaseEnabled } from '@/shared/lib/supabase/env';
import type { Playlist } from '@/entities/playlist';

type Params = Promise<{ locale: string; slug: string }>;

async function fetchPlaylist(slug: string): Promise<Playlist & { trackCount: number } | null> {
  if (!supabaseEnabled) return null;
  try {
    const { getSupabaseServerClient } = await import('@/shared/lib/supabase/server');
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase
      .from('playlists')
      .select('*, playlist_tracks(count)')
      .eq('slug', slug)
      .single();
    if (!data) return null;
    const row = data as Record<string, unknown>;
    const countArr = row.playlist_tracks as { count: number }[] | null;
    const trackCount = countArr?.[0]?.count ?? 0;
    const pl: Playlist & { trackCount: number } = {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      visibility: (row.visibility as 'public' | 'private' | 'unlisted') ?? 'private',
      tracks: [],
      trackCount,
    };
    if (row.description) pl.description = row.description as string;
    if (row.owner_id) pl.ownerId = row.owner_id as string;
    if (row.cover_path) pl.coverPath = row.cover_path as string;
    return pl;
  } catch {
    return null;
  }
}

async function getCurrentUserId(): Promise<string | null> {
  if (!supabaseEnabled) return null;
  try {
    const { getSupabaseServerClient } = await import('@/shared/lib/supabase/server');
    const supabase = await getSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export default async function PlaylistPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('playlist');
  const [playlist, userId] = await Promise.all([fetchPlaylist(slug), getCurrentUserId()]);

  if (!playlist) {
    return (
      <Stack spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
        <GlassPanel sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: cssVars.textMuted }}>
            {supabaseEnabled ? 'Playlist not found.' : 'Playlists require a Supabase connection.'}
          </Typography>
        </GlassPanel>
      </Stack>
    );
  }

  const isOwner = !!userId && userId === playlist.ownerId;

  return (
    <Stack spacing={5} sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box>
        <Typography
          sx={{
            color: accent.cyan,
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          Playlist
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700 }}>
          <GradientText variant="aurora">{playlist.title}</GradientText>
        </Typography>
        {playlist.description ? (
          <Typography sx={{ color: cssVars.textMuted, mt: 1, fontSize: '0.95rem' }}>
            {playlist.description}
          </Typography>
        ) : null}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={playlist.visibility === 'public' ? t('public') : playlist.visibility === 'unlisted' ? t('unlisted') : t('private')}
            size="small"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: cssVars.textMuted,
              background: cssVars.hoverSubtle,
              border: `1px solid ${cssVars.borderSubtle}`,
            }}
          />
          <Chip
            label={t('trackCount', { count: playlist.trackCount })}
            size="small"
            sx={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: cssVars.textMuted,
              background: cssVars.hoverSubtle,
              border: `1px solid ${cssVars.borderSubtle}`,
            }}
          />
          <PlaylistShareButton
            playlistId={playlist.id}
            visibility={playlist.visibility}
            isOwner={isOwner}
          />
        </Stack>
      </Box>

      <PlaylistEditorWrapper playlistId={playlist.id} isOwner={isOwner} />
    </Stack>
  );
}
