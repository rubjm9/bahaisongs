import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Stack, Typography, Chip, Box } from '@mui/material';
import { Music, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { GradientText } from '@/shared/ui/GradientText';
import { GlassPanel } from '@/shared/ui/GlassPanel';
import { TrackPlaceholder } from '@/features/catalog/components/TrackPlaceholder';
import { LyricsViewer } from '@/features/lyrics/components/LyricsViewer';
import { categoryLabel, categoryKindColor } from '@/features/catalog/lib/category-labels';
import { PlayButton } from '@/features/player/components/PlayButton';
import { LikeButton } from '@/features/favorites/components/LikeButton';
import { AddToPlaylistButton } from '@/features/playlists/components/AddToPlaylistButton';
import { toPlayable } from '@/features/player/lib/playable';
import { getAllTracks, getTrackBySlug, getTrackNeighbours } from '@/server/data/catalog';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { trackCanonicalUrl, trackPath } from '@/shared/lib/seo/paths';
import { SITE_URL } from '@/shared/lib/seo/site';
import { MusicRecordingJsonLd, BreadcrumbJsonLd } from '@/shared/lib/seo/JsonLd';

const DUPLICATE_SUFFIX_RE = /(-v?-?\d+)$/;

function primarySlug(slug: string): string {
  return slug.replace(DUPLICATE_SUFFIX_RE, '');
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const tracks = await getAllTracks();
  return tracks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const track = await getTrackBySlug(slug);
  if (!track) return { title: 'BahaiSongs' };

  const loc = locale as Locale;
  setRequestLocale(loc);
  const t = await getTranslations({ locale: loc, namespace: 'meta.song' });

  // Duplicate versions point canonical to the primary slug
  const primary = primarySlug(slug);
  const canonical = trackCanonicalUrl(primary);

  const chords = track.hasChords ? t('chordsSuffix') : '';
  const description = t('description', { title: track.title, chords });

  return {
    title: track.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: track.title,
      description,
      type: 'music.song',
      url: canonical,
    },
  };
}

export default async function SongPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const track = await getTrackBySlug(slug);
  if (!track) notFound();

  const t = await getTranslations('song');
  const tCommon = await getTranslations('common');
  const { prev, next } = await getTrackNeighbours(slug);
  const loc = locale as Locale;
  const playable = toPlayable(track);
  const canonicalUrl = trackCanonicalUrl(primarySlug(slug));

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', paddingY: { xs: 2, md: 4 } }}>
      <MusicRecordingJsonLd track={track} url={canonicalUrl} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Inicio', url: SITE_URL },
          { name: 'Catálogo', url: `${SITE_URL}/library` },
          { name: track.title, url: canonicalUrl },
        ]}
      />
      {/* Two-column grid on desktop: sticky meta-panel left, scrollable lyrics right */}
      <Box
        sx={{
          display: { xs: 'flex', lg: 'grid' },
          flexDirection: 'column',
          gridTemplateColumns: { lg: '2fr 3fr' },
          gap: { xs: 4, lg: 6 },
          alignItems: 'start',
        }}
      >
        {/* Left column — track info + player (sticky on desktop) */}
        <Stack spacing={3} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
          {/* Title first — the primary focus */}
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
              {t('eyebrow')}
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontSize: 'clamp(2rem, 3vw + 0.5rem, 3.5rem)',
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              <GradientText variant="aurora">{track.title}</GradientText>
            </Typography>
            <Box sx={{ color: cssVars.textMuted, fontSize: '1rem', mt: 1 }}>
              {t('by')}{' '}
              <Link
                href={`/${locale}/artist/${track.artistSlug}`}
                style={{ color: cssVars.textPrimary, fontWeight: 500 }}
              >
                {track.artist}
              </Link>
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={track.language.toUpperCase()}
                sx={chipSx({ filled: false, accent: cssVars.textMuted })}
              />
              {track.hasAudio ? (
                <Chip
                  icon={<Music size={12} />}
                  label={t('hasAudio')}
                  sx={chipSx({ filled: true, accent: accent.cyan })}
                />
              ) : null}
              {track.hasChords ? (
                <Chip
                  icon={<BookOpen size={12} />}
                  label={t('hasChords')}
                  sx={chipSx({ filled: true, accent: accent.glow })}
                />
              ) : null}
              {track.categorySlugs
                .filter((c) => c !== 'con-acordes' && c !== 'con-audio' && c !== 'cancion')
                .slice(0, 4)
                .map((c) => (
                  <Link
                    key={c}
                    href={`/${locale}/category/${c}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Chip
                      label={categoryLabel(c, loc)}
                      sx={chipSx({ filled: false, accent: categoryKindColor(c), link: true })}
                    />
                  </Link>
                ))}
            </Stack>
          </Box>

          {/* Player panel — artwork thumbnail + controls */}
          {track.hasAudio ? (
            <GlassPanel sx={{ paddingX: 2.5, paddingY: 2 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <TrackPlaceholder
                  title={track.title}
                  size={64}
                  sx={{ flexShrink: 0, borderRadius: `${radii.md}px` }}
                />
                <PlayButton track={playable} size={48} ariaLabel={`Reproducir ${track.title}`} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ color: cssVars.textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>
                    {t('playReady')}
                  </Box>
                  <Box sx={{ color: cssVars.textMuted, fontSize: '0.78rem' }}>
                    {t('playReadyHint')}
                  </Box>
                </Box>
                <LikeButton trackId={track.slug} trackSlug={track.slug} />
                <AddToPlaylistButton trackSlug={track.slug} />
              </Stack>
            </GlassPanel>
          ) : (
            <GlassPanel sx={{ paddingX: 2.5, paddingY: 2 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <TrackPlaceholder
                  title={track.title}
                  size={64}
                  sx={{ flexShrink: 0, borderRadius: `${radii.md}px` }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ color: cssVars.textPrimary, fontWeight: 600, fontSize: '0.9rem' }}>
                    {t('noAudio')}
                  </Box>
                  <Box sx={{ color: cssVars.textMuted, fontSize: '0.78rem' }}>
                    {t('noAudioHint')}
                  </Box>
                </Box>
                <LikeButton trackId={track.slug} trackSlug={track.slug} />
                <AddToPlaylistButton trackSlug={track.slug} />
              </Stack>
            </GlassPanel>
          )}
        </Stack>

        {/* Right column — lyrics */}
        <Box>
          <Typography
            sx={{
              color: accent.cyan,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              mb: 2,
            }}
          >
            {t('lyricsTitle')}
          </Typography>
          <LyricsViewer
            lyrics={track.lyrics}
            lyricsChordPro={track.lyricsChordPro}
            syncedLyrics={track.syncedLyrics}
            hasChords={track.hasChords}
            trackSlug={track.slug}
            locale={locale}
          />
        </Box>
      </Box>

      {/* Prev / next navigation — full width below the grid */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mt: { xs: 6, lg: 8 }, alignItems: 'stretch' }}
      >
        <NeighbourLink
          href={prev ? trackPath(prev.slug) : null}
          label={tCommon('previous')}
          title={prev?.title ?? ''}
          direction="prev"
        />
        <NeighbourLink
          href={next ? trackPath(next.slug) : null}
          label={tCommon('next')}
          title={next?.title ?? ''}
          direction="next"
        />
      </Stack>
    </Box>
  );
}

interface ChipStyleOpts {
  filled: boolean;
  accent: string;
  link?: boolean;
}

function chipSx({ filled, accent, link = false }: ChipStyleOpts) {
  return {
    height: 24,
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: accent,
    background: filled ? `${accent}1a` : cssVars.hoverSubtle,
    border: `1px solid ${cssVars.borderSubtle}`,
    '& .MuiChip-icon': { color: accent },
    ...(link
      ? {
          cursor: 'pointer',
          '&:hover': { background: cssVars.navActiveBg },
        }
      : {}),
  };
}

function NeighbourLink({
  href,
  label,
  title,
  direction,
}: {
  href: string | null;
  label: string;
  title: string;
  direction: 'prev' | 'next';
}) {
  const content = (
    <Box
      sx={{
        flex: 1,
        padding: 2,
        borderRadius: `${radii.md}px`,
        background: cssVars.bgGlass,
        border: `1px solid ${cssVars.borderSubtle}`,
        backdropFilter: 'blur(12px)',
        opacity: href ? 1 : 0.4,
        cursor: href ? 'pointer' : 'not-allowed',
        textAlign: direction === 'prev' ? 'left' : 'right',
        transition: 'border-color 160ms',
        '&:hover': href ? { borderColor: cssVars.borderStrong } : {},
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: direction === 'prev' ? 'flex-start' : 'flex-end',
          color: cssVars.textMuted,
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          mb: 0.5,
        }}
      >
        {direction === 'prev' ? <ArrowLeft size={12} className="bs-flip-rtl" /> : null}
        <span>{label}</span>
        {direction === 'next' ? <ArrowRight size={12} className="bs-flip-rtl" /> : null}
      </Stack>
      <Box
        sx={{
          color: cssVars.textPrimary,
          fontWeight: 600,
          fontSize: '0.95rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title || '—'}
      </Box>
    </Box>
  );

  if (!href) return content;
  return (
    <Link href={href} style={{ textDecoration: 'none', flex: 1, display: 'flex' }}>
      {content}
    </Link>
  );
}
