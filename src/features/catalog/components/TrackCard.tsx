import Link from 'next/link';
import { Box, Stack, Chip } from '@mui/material';
import { Music, BookOpen } from 'lucide-react';
import { TrackPlaceholder } from './TrackPlaceholder';
import { PlayButton } from '@/features/player/components/PlayButton';
import { AddToPlaylistButton } from '@/features/playlists/components/AddToPlaylistButton';
import { accent, cssVars, radii } from '@/shared/theme/tokens';
import type { Locale } from '@/shared/lib/i18n/config';
import { trackPath } from '@/shared/lib/seo/paths';
import type { PlayableTrack } from '@/features/player/lib/types';

interface Props {
  track: PlayableTrack & {
    hasChords?: boolean;
    hasAudio?: boolean;
  };
  locale: Locale;
  queue?: readonly PlayableTrack[];
  queueIndex?: number;
}

export function TrackCard({ track, locale: _locale, queue, queueIndex }: Props) {
  const href = trackPath(track.slug);
  return (
    <Box
      sx={{
        position: 'relative',
        '&:hover .bs-track-card-play': { opacity: 1 },
        '&:hover .bs-card-add-playlist': { opacity: 1 },
      }}
    >
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            padding: 1.5,
            borderRadius: `${radii.lg}px`,
            background: cssVars.bgGlass,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${cssVars.borderSubtle}`,
            alignItems: 'center',
            minHeight: 88,
            transition: 'transform 200ms, border-color 200ms, box-shadow 200ms',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: cssVars.borderStrong,
              boxShadow: '0 16px 32px rgba(0,0,0,0.32)',
            },
          }}
        >
          <TrackPlaceholder
            title={track.title}
            size={68}
            sx={{ flexShrink: 0, borderRadius: `${radii.md}px` }}
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                fontWeight: 600,
                color: cssVars.textPrimary,
                fontSize: '0.9rem',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {track.title}
            </Box>
            <Box
              sx={{
                color: cssVars.textMuted,
                fontSize: '0.75rem',
                mt: 0.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {track.artist}
            </Box>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}
            >
              <Chip
                size="small"
                label={track.language.toUpperCase()}
                sx={{
                  height: 18,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  background: cssVars.hoverSubtle,
                  color: cssVars.textMuted,
                  border: `1px solid ${cssVars.borderSubtle}`,
                }}
              />
              {track.hasAudio ? (
                <Box
                  aria-hidden
                  title="Audio disponible"
                  sx={{ display: 'inline-flex', color: accent.cyan }}
                >
                  <Music size={12} />
                </Box>
              ) : null}
              {track.hasChords ? (
                <Box
                  aria-hidden
                  title="Acordes disponibles"
                  sx={{ display: 'inline-flex', color: accent.glow }}
                >
                  <BookOpen size={12} />
                </Box>
              ) : null}
              <Box
                className="bs-card-add-playlist"
                sx={{ opacity: 0, transition: 'opacity 160ms', ml: 'auto' }}
                onClick={(e) => e.preventDefault()}
              >
                <AddToPlaylistButton trackId={track.slug} />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Link>

      {/* Play overlay on artwork — desktop hover only */}
      <Box
        className="bs-track-card-play"
        sx={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 68,
          height: 68,
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: `${radii.md}px`,
          background: 'rgba(0,0,0,0.42)',
          opacity: 0,
          transition: 'opacity 180ms',
          zIndex: 2,
        }}
      >
        <PlayButton
          track={track}
          {...(queue ? { queue } : {})}
          {...(typeof queueIndex === 'number' ? { queueIndex } : {})}
          size={30}
        />
      </Box>
    </Box>
  );
}
